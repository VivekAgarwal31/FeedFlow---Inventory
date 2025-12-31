import express from 'express';
import Payment from '../models/Payment.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import LedgerAccount from '../models/LedgerAccount.js';
import { authenticate } from '../middleware/auth.js';
import { createJournalEntry, initializeDefaultAccounts } from '../utils/journalEntry.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Record a new payment
router.post('/record', async (req, res) => {
    try {
        // AUDIT FIX - TASK 4: Backward compatibility for paymentMode
        // Accept both paymentMethod (canonical) and paymentMode (legacy) for backward compatibility
        const { transactionType, transactionId, amount, paymentMethod, paymentMode, paymentDate, referenceNumber, notes } = req.body;
        const normalizedPaymentMethod = paymentMethod || paymentMode || 'cash';

        // Validate input
        if (!transactionType || !transactionId || !amount) {
            return res.status(400).json({ message: 'Transaction type, ID, and amount are required' });
        }

        // Get the transaction
        const TransactionModel = transactionType === 'sale' ? SalesOrder : PurchaseOrder;
        const transaction = await TransactionModel.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Verify company ownership - handle both ObjectId and populated object
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        if (transaction.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify payment amount doesn't exceed amount due
        if (amount > transaction.amountDue) {
            return res.status(400).json({
                message: `Payment amount (₹${amount}) exceeds amount due (₹${transaction.amountDue})`
            });
        }

        // Get party details
        const partyType = transactionType === 'sale' ? 'client' : 'supplier';
        const partyId = transactionType === 'sale' ? transaction.clientId : transaction.supplierId;
        const partyName = transactionType === 'sale' ? transaction.clientName : transaction.supplierName;

        // Create payment record
        const payment = new Payment({
            companyId: userCompanyId,
            transactionType,
            transactionId,
            transactionModel: transactionType === 'sale' ? 'SalesOrder' : 'PurchaseOrder',
            transactionNumber: transaction.invoiceNumber || transaction.billNumber || transactionId,
            partyType,
            partyId,
            partyModel: partyType === 'client' ? 'Client' : 'Supplier',
            partyName,
            amount,
            paymentMethod: normalizedPaymentMethod,
            paymentDate: paymentDate || new Date(),
            referenceNumber,
            notes,
            recordedBy: req.user.fullName
        });

        await payment.save();

        // Update transaction
        transaction.amountPaid += amount;
        transaction.lastPaymentDate = payment.paymentDate;
        transaction.paymentHistory.push(payment._id);
        await transaction.save(); // Pre-save middleware will update paymentStatus and amountDue

        // Update party credit/payable
        if (partyType === 'client' && partyId) {
            const client = await Client.findById(partyId);
            if (client) {
                client.currentCredit = Math.max(0, client.currentCredit - amount);
                client.lastPaymentDate = payment.paymentDate;
                client.lastPaymentAmount = amount;
                client.updateCreditStatus();
                await client.save();
            }
        } else if (partyType === 'supplier' && partyId) {
            const supplier = await Supplier.findById(partyId);
            if (supplier) {
                supplier.currentPayable = Math.max(0, supplier.currentPayable - amount);
                supplier.lastPaymentDate = payment.paymentDate;
                supplier.lastPaymentAmount = amount;
                await supplier.save();
            }
        }

        // AUDIT FIX - TASK 6: Improved journal entry error handling
        // Create journal entry for accounting and track its status
        try {
            // Check if accounts are initialized, if not, initialize them
            const accountCount = await LedgerAccount.countDocuments({ companyId: userCompanyId });
            if (accountCount === 0) {
                await initializeDefaultAccounts(userCompanyId);
            }

            const accountName = (normalizedPaymentMethod === 'cash') ? 'Cash' : 'Bank';

            if (transactionType === 'sale') {
                // Customer payment: Debit Cash/Bank, Credit Accounts Receivable
                await createJournalEntry({
                    companyId: userCompanyId,
                    entryDate: payment.paymentDate,
                    entryType: 'payment_received',
                    referenceType: 'Payment',
                    referenceId: payment._id,
                    description: `Payment received from ${partyName} - ${payment.transactionNumber}`,
                    lines: [
                        { accountName, debit: amount, credit: 0 },
                        { accountName: 'Accounts Receivable', debit: 0, credit: amount }
                    ],
                    createdBy: req.user._id
                });
            } else {
                // Supplier payment: Debit Accounts Payable, Credit Cash/Bank
                await createJournalEntry({
                    companyId: userCompanyId,
                    entryDate: payment.paymentDate,
                    entryType: 'payment_made',
                    referenceType: 'Payment',
                    referenceId: payment._id,
                    description: `Payment made to ${partyName} - ${payment.transactionNumber}`,
                    lines: [
                        { accountName: 'Accounts Payable', debit: amount, credit: 0 },
                        { accountName, debit: 0, credit: amount }
                    ],
                    createdBy: req.user._id
                });
            }

            // Mark journal entry as successful
            payment.journalEntryStatus = 'success';
            await payment.save();

        } catch (journalError) {
            // AUDIT FIX - TASK 6: Track journal entry failure in payment record
            console.error('❌ JOURNAL ENTRY FAILED for payment:', {
                paymentId: payment._id,
                transactionType,
                amount,
                partyName,
                error: journalError.message,
                stack: journalError.stack
            });

            // Update payment record to track failure
            payment.journalEntryStatus = 'failed';
            payment.journalEntryError = journalError.message;
            await payment.save();

            // Don't fail the payment transaction, but ensure visibility
            console.warn('⚠️  Payment recorded successfully but journal entry failed - manual reconciliation may be needed');
        }

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment,
            transaction: {
                amountPaid: transaction.amountPaid,
                amountDue: transaction.amountDue,
                paymentStatus: transaction.paymentStatus
            }
        });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get payment history for a transaction
router.get('/transaction/:id', async (req, res) => {
    try {
        const { type } = req.query; // 'sale' or 'purchase'

        if (!type) {
            return res.status(400).json({ message: 'Transaction type is required' });
        }

        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        const payments = await Payment.find({
            companyId: userCompanyId,
            transactionId: req.params.id,
            transactionType: type
        }).sort({ paymentDate: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get payment history for a client/supplier
router.get('/party/:id', async (req, res) => {
    try {
        const { type, page = 1, limit = 50 } = req.query; // type: 'client' or 'supplier'

        if (!type) {
            return res.status(400).json({ message: 'Party type is required' });
        }

        const skip = (page - 1) * limit;

        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        const payments = await Payment.find({
            companyId: userCompanyId,
            partyId: req.params.id,
            partyType: type
        })
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments({
            companyId: userCompanyId,
            partyId: req.params.id,
            partyType: type
        });

        res.json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching party payments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Record client-level payment (auto-allocates across bills)
router.post('/record-client-payment', async (req, res) => {
    try {
        // AUDIT FIX - TASK 4: Backward compatibility for paymentMode
        const { clientId, amount, paymentMode, paymentMethod, paymentDate, referenceNumber, notes } = req.body;
        const normalizedPaymentMethod = paymentMethod || paymentMode || 'cash';
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Validate input
        if (!clientId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Client ID and valid amount are required' });
        }

        // Get client
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Verify company ownership
        if (client.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get all unpaid/partial sales orders for this client (oldest first)
        const unpaidSalesOrders = await SalesOrder.find({
            companyId: userCompanyId,
            clientId: clientId,
            paymentStatus: { $in: ['pending', 'partial'] }
        }).sort({ orderDate: 1 }); // Oldest first

        let remainingAmount = parseFloat(amount);
        const allocations = [];
        const salesUpdated = [];

        // Build allocations array
        for (const order of unpaidSalesOrders) {
            if (remainingAmount <= 0.01) break; // Account for floating point precision

            // Round to 2 decimal places to avoid floating point issues
            const amountDue = Math.round((order.amountDue || (order.totalAmount - (order.amountPaid || 0))) * 100) / 100;

            if (amountDue <= 0.01) continue; // Skip if already paid

            // Calculate payment for this order and round to 2 decimals
            const paymentForThisOrder = Math.round(Math.min(remainingAmount, amountDue) * 100) / 100;
            const willBeCleared = (order.amountPaid + paymentForThisOrder) >= order.totalAmount;

            // Add to allocations array
            allocations.push({
                saleId: order._id,
                invoiceNumber: order.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                amountAllocated: paymentForThisOrder,
                status: willBeCleared ? 'cleared' : 'partial'
            });

            // Update order with rounded values
            order.amountPaid = Math.round(((order.amountPaid || 0) + paymentForThisOrder) * 100) / 100;
            order.amountDue = Math.round((order.totalAmount - order.amountPaid) * 100) / 100;

            // Update payment status
            if (order.amountPaid >= order.totalAmount - 0.01) { // Account for rounding
                order.paymentStatus = 'paid';
                order.amountDue = 0; // Ensure it's exactly 0
            } else if (order.amountPaid > 0) {
                order.paymentStatus = 'partial';
            }

            await order.save();
            salesUpdated.push({
                saleId: order._id,
                invoiceNumber: order.orderNumber,
                amountPaid: paymentForThisOrder,
                newStatus: order.paymentStatus
            });

            remainingAmount = Math.round((remainingAmount - paymentForThisOrder) * 100) / 100;
        }

        // Create ONE payment record with all allocations
        const payment = new Payment({
            companyId: userCompanyId,
            transactionType: 'sale',
            transactionId: allocations.length > 0 ? allocations[0].saleId : null,
            transactionModel: 'SalesOrder',
            clientId: clientId,
            partyId: clientId,
            partyType: 'client',
            partyModel: 'Client',
            partyName: client.name,
            amount: parseFloat(amount),
            paymentMethod: normalizedPaymentMethod,
            paymentDate: paymentDate || new Date(),
            referenceNumber,
            notes,
            recordedBy: req.user.fullName || req.user.email,
            allocations: allocations
        });

        await payment.save();

        // Create journal entry for accounting
        try {
            // Check if accounts are initialized
            const accountCount = await LedgerAccount.countDocuments({ companyId: userCompanyId });
            if (accountCount === 0) {
                await initializeDefaultAccounts(userCompanyId);
            }

            const accountName = (normalizedPaymentMethod === 'cash') ? 'Cash' : 'Bank';

            // Customer payment: Debit Cash/Bank, Credit Accounts Receivable
            await createJournalEntry({
                companyId: userCompanyId,
                entryDate: payment.paymentDate,
                entryType: 'payment_received',
                referenceType: 'Payment',
                referenceId: payment._id,
                description: `Payment received from ${client.name} - ₹${amount}`,
                lines: [
                    { accountName, debit: amount, credit: 0 },
                    { accountName: 'Accounts Receivable', debit: 0, credit: amount }
                ],
                createdBy: req.user._id
            });
        } catch (journalError) {
            console.error('Journal entry creation error for client payment:', {
                error: journalError.message,
                paymentId: payment._id,
                clientName: client.name,
                amount,
                stack: journalError.stack
            });
            // Don't fail the payment if journal entry fails
        }


        // Recalculate client's credit from ALL unpaid/partial sales orders (including updated ones)
        const allUnpaidSalesOrders = await SalesOrder.find({
            companyId: userCompanyId,
            clientId: clientId,
            paymentStatus: { $in: ['pending', 'partial'] }
        });

        const totalReceivable = allUnpaidSalesOrders.reduce((sum, order) => {
            const due = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
            return sum + due;
        }, 0);

        client.currentCredit = Math.round(Math.max(0, totalReceivable) * 100) / 100;

        // If payment exceeds total receivable, store as overpaid
        if (remainingAmount > 0) {
            client.overpaidAmount = (client.overpaidAmount || 0) + remainingAmount;
        }

        await client.save();

        res.json({
            message: 'Payment recorded successfully',
            payment: payment._id,
            salesUpdated,
            overpaidAmount: remainingAmount > 0 ? remainingAmount : 0,
            newReceivable: client.currentCredit,
            totalOverpaid: client.overpaidAmount
        });
    } catch (error) {
        console.error('Error recording client payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Record supplier-level payment (auto-allocates across bills)
router.post('/record-supplier-payment', async (req, res) => {
    try {
        // AUDIT FIX - TASK 4: Backward compatibility for paymentMode
        const { supplierId, amount, paymentMode, paymentMethod, paymentDate, referenceNumber, notes } = req.body;
        const normalizedPaymentMethod = paymentMethod || paymentMode || 'cash';
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Validate input
        if (!supplierId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Supplier ID and valid amount are required' });
        }

        // Get supplier
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Verify company ownership
        if (supplier.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get all unpaid/partial purchase orders for this supplier (oldest first)
        const unpaidPurchaseOrders = await PurchaseOrder.find({
            companyId: userCompanyId,
            supplierId: supplierId,
            paymentStatus: { $in: ['pending', 'partial'] }
        }).sort({ orderDate: 1 }); // Oldest first

        let remainingAmount = parseFloat(amount);
        const allocations = [];
        const purchasesUpdated = [];

        // Build allocations array
        for (const order of unpaidPurchaseOrders) {
            if (remainingAmount <= 0.01) break;

            const amountDue = Math.round((order.amountDue || (order.totalAmount - (order.amountPaid || 0))) * 100) / 100;

            if (amountDue <= 0.01) continue;

            const paymentForThisOrder = Math.round(Math.min(remainingAmount, amountDue) * 100) / 100;
            const willBeCleared = (order.amountPaid + paymentForThisOrder) >= order.totalAmount;

            allocations.push({
                saleId: order._id,
                invoiceNumber: order.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                amountAllocated: paymentForThisOrder,
                status: willBeCleared ? 'cleared' : 'partial'
            });

            order.amountPaid = Math.round(((order.amountPaid || 0) + paymentForThisOrder) * 100) / 100;
            order.amountDue = Math.round((order.totalAmount - order.amountPaid) * 100) / 100;

            if (order.amountPaid >= order.totalAmount - 0.01) {
                order.paymentStatus = 'paid';
                order.amountDue = 0;
            } else if (order.amountPaid > 0) {
                order.paymentStatus = 'partial';
            }

            await order.save();
            purchasesUpdated.push({
                purchaseId: order._id,
                billNumber: order.orderNumber,
                amountPaid: paymentForThisOrder,
                newStatus: order.paymentStatus
            });

            remainingAmount = Math.round((remainingAmount - paymentForThisOrder) * 100) / 100;
        }

        // Create ONE payment record with all allocations
        const payment = new Payment({
            companyId: userCompanyId,
            transactionType: 'purchase',
            transactionId: allocations.length > 0 ? allocations[0].saleId : null,
            transactionModel: 'PurchaseOrder',
            supplierId: supplierId,
            partyId: supplierId,
            partyType: 'supplier',
            partyModel: 'Supplier',
            partyName: supplier.name,
            amount: parseFloat(amount),
            paymentMethod: normalizedPaymentMethod,
            paymentDate: paymentDate || new Date(),
            referenceNumber,
            notes,
            recordedBy: req.user.fullName || req.user.email,
            allocations: allocations
        });

        await payment.save();

        // Create journal entry for accounting
        try {
            // Check if accounts are initialized
            const accountCount = await LedgerAccount.countDocuments({ companyId: userCompanyId });
            if (accountCount === 0) {
                await initializeDefaultAccounts(userCompanyId);
            }

            const accountName = (normalizedPaymentMethod === 'cash') ? 'Cash' : 'Bank';

            // Supplier payment: Debit Accounts Payable, Credit Cash/Bank
            await createJournalEntry({
                companyId: userCompanyId,
                entryDate: payment.paymentDate,
                entryType: 'payment_made',
                referenceType: 'Payment',
                referenceId: payment._id,
                description: `Payment made to ${supplier.name} - ₹${amount}`,
                lines: [
                    { accountName: 'Accounts Payable', debit: amount, credit: 0 },
                    { accountName, debit: 0, credit: amount }
                ],
                createdBy: req.user._id
            });
        } catch (journalError) {
            console.error('Journal entry creation error for supplier payment:', {
                error: journalError.message,
                paymentId: payment._id,
                supplierName: supplier.name,
                amount,
                stack: journalError.stack
            });
            // Don't fail the payment if journal entry fails
        }

        // Recalculate supplier's payable from ALL unpaid/partial purchase orders (including updated ones)
        const allUnpaidPurchaseOrders = await PurchaseOrder.find({
            companyId: userCompanyId,
            supplierId: supplierId,
            paymentStatus: { $in: ['pending', 'partial'] }
        });

        const totalPayable = allUnpaidPurchaseOrders.reduce((sum, order) => {
            const due = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
            return sum + due;
        }, 0);

        supplier.currentPayable = Math.round(Math.max(0, totalPayable) * 100) / 100;

        if (remainingAmount > 0) {
            supplier.overpaidAmount = (supplier.overpaidAmount || 0) + remainingAmount;
        }

        await supplier.save();

        res.json({
            message: 'Payment recorded successfully',
            payment: payment._id,
            purchasesUpdated,
            overpaidAmount: remainingAmount > 0 ? remainingAmount : 0,
            newPayable: supplier.currentPayable,
            totalOverpaid: supplier.overpaidAmount
        });
    } catch (error) {
        console.error('Error recording supplier payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all payments for a specific supplier
router.get('/supplier/:supplierId', authenticate, async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        const payments = await Payment.find({
            companyId: userCompanyId,
            partyId: req.params.supplierId,
            partyType: 'supplier'
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ payments });
    } catch (error) {
        console.error('Get supplier payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all payment transactions with pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            Payment.find({ companyId: userCompanyId })
                .sort({ paymentDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments({ companyId: userCompanyId })
        ]);

        res.json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all payments for a specific client
router.get('/client/:clientId', authenticate, async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        const payments = await Payment.find({
            companyId: userCompanyId,
            partyId: req.params.clientId, // Assuming clientId maps to partyId
            partyType: 'client' // Explicitly filter for client payments
        })
            .sort({ createdAt: -1 }) // Latest first by creation time
            .lean();

        res.json({ payments });
    } catch (error) {
        console.error('Get client payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all payments with filters
router.get('/all', async (req, res) => {
    try {
        const { startDate, endDate, partyType, paymentMethod, page = 1, limit = 50 } = req.query;

        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        const query = { companyId: userCompanyId };

        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        if (partyType) query.partyType = partyType;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        const skip = (page - 1) * limit;

        const payments = await Payment.find(query)
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        // Calculate totals
        const totalAmount = await Payment.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            payments,
            totalAmount: totalAmount[0]?.total || 0,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a payment (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Verify company ownership
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        if (payment.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete payments' });
        }

        // Reverse the payment from transaction
        const TransactionModel = payment.transactionType === 'sale' ? SalesOrder : PurchaseOrder;
        const transaction = await TransactionModel.findById(payment.transactionId);

        if (transaction) {
            transaction.amountPaid = Math.max(0, transaction.amountPaid - payment.amount);
            transaction.paymentHistory = transaction.paymentHistory.filter(
                p => p.toString() !== payment._id.toString()
            );
            await transaction.save();

            // Update party credit/payable
            if (payment.partyType === 'client' && payment.partyId) {
                const client = await Client.findById(payment.partyId);
                if (client) {
                    client.currentCredit += payment.amount;
                    client.updateCreditStatus();
                    await client.save();
                }
            } else if (payment.partyType === 'supplier' && payment.partyId) {
                const supplier = await Supplier.findById(payment.partyId);
                if (supplier) {
                    supplier.currentPayable += payment.amount;
                    await supplier.save();
                }
            }
        }

        await payment.deleteOne();

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
