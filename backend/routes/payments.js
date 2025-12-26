import express from 'express';
import Payment from '../models/Payment.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Record a new payment
router.post('/record', async (req, res) => {
    try {
        const { transactionType, transactionId, amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

        // Validate input
        if (!transactionType || !transactionId || !amount) {
            return res.status(400).json({ message: 'Transaction type, ID, and amount are required' });
        }

        // Get the transaction
        const TransactionModel = transactionType === 'sale' ? Sale : Purchase;
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
            transactionModel: transactionType === 'sale' ? 'Sale' : 'Purchase',
            transactionNumber: transaction.invoiceNumber || transaction.billNumber || transactionId,
            partyType,
            partyId,
            partyModel: partyType === 'client' ? 'Client' : 'Supplier',
            partyName,
            amount,
            paymentMethod: paymentMethod || 'cash',
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
        const { clientId, amount, paymentMode, paymentDate, referenceNumber, notes } = req.body;
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

        // Get all unpaid/partial sales for this client (oldest first)
        const unpaidSales = await Sale.find({
            companyId: userCompanyId,
            clientId: clientId,
            paymentStatus: { $in: ['pending', 'partial'] }
        }).sort({ saleDate: 1 }); // Oldest first

        let remainingAmount = parseFloat(amount);
        const paymentsCreated = [];
        const salesUpdated = [];

        // Allocate payment across bills
        for (const sale of unpaidSales) {
            if (remainingAmount <= 0) break;

            const amountDue = sale.amountDue || (sale.totalAmount - (sale.amountPaid || 0));

            if (amountDue <= 0) continue; // Skip if already paid

            const paymentForThisSale = Math.min(remainingAmount, amountDue);

            // Create payment record
            const payment = new Payment({
                companyId: userCompanyId,
                transactionType: 'sale',
                transactionId: sale._id,
                transactionModel: 'Sale',
                clientId: clientId,
                partyId: clientId,
                partyType: 'client',
                partyModel: 'Client',
                partyName: client.name,
                amount: paymentForThisSale,
                paymentMode: paymentMode || 'cash',
                paymentDate: paymentDate || new Date(),
                referenceNumber,
                notes,
                recordedBy: req.user.fullName || req.user.email
            });

            await payment.save();
            paymentsCreated.push(payment);

            // Update sale
            sale.amountPaid = (sale.amountPaid || 0) + paymentForThisSale;
            sale.amountDue = sale.totalAmount - sale.amountPaid;

            // Update payment status
            if (sale.amountPaid >= sale.totalAmount) {
                sale.paymentStatus = 'paid';
            } else if (sale.amountPaid > 0) {
                sale.paymentStatus = 'partial';
            }

            await sale.save();
            salesUpdated.push({
                saleId: sale._id,
                invoiceNumber: sale.invoiceNumber,
                amountPaid: paymentForThisSale,
                newStatus: sale.paymentStatus
            });

            remainingAmount -= paymentForThisSale;
        }

        // Update client's credit and overpaid amount
        const totalReceivable = unpaidSales.reduce((sum, sale) => {
            const due = sale.amountDue || (sale.totalAmount - (sale.amountPaid || 0));
            return sum + due;
        }, 0);

        client.currentCredit = Math.max(0, totalReceivable - amount);

        // If payment exceeds total receivable, store as overpaid
        if (remainingAmount > 0) {
            client.overpaidAmount = (client.overpaidAmount || 0) + remainingAmount;
        }

        await client.save();

        res.json({
            message: 'Payment recorded successfully',
            paymentsCreated: paymentsCreated.length,
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
            .sort({ paymentDate: -1 })
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
        const TransactionModel = payment.transactionType === 'sale' ? Sale : Purchase;
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
