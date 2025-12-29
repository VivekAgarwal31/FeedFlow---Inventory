import express from 'express';
import { body, validationResult } from 'express-validator';
import SalesOrder from '../models/SalesOrder.js';
import Client from '../models/Client.js';
import StockItem from '../models/StockItem.js';
import LedgerAccount from '../models/LedgerAccount.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { createJournalEntry, initializeDefaultAccounts } from '../utils/journalEntry.js';

const router = express.Router();

// Get all sales orders with pagination and filters
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { companyId };

        if (req.query.status) {
            filter.orderStatus = req.query.status;
        }

        if (req.query.clientName) {
            filter.clientName = { $regex: req.query.clientName, $options: 'i' };
        }

        if (req.query.startDate || req.query.endDate) {
            filter.orderDate = {};
            if (req.query.startDate) filter.orderDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.orderDate.$lte = new Date(req.query.endDate);
        }

        const salesOrders = await SalesOrder.find(filter)
            .sort({ orderDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await SalesOrder.countDocuments(filter);

        res.json({
            salesOrders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get sales orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single sales order with delivery history
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const salesOrder = await SalesOrder.findOne({
            _id: req.params.id,
            companyId
        }).populate('linkedDeliveries').lean();

        if (!salesOrder) {
            return res.status(404).json({ message: 'Sales order not found' });
        }

        res.json(salesOrder);
    } catch (error) {
        console.error('Get sales order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending sales orders for a specific client
router.get('/pending/:clientId', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const salesOrders = await SalesOrder.find({
            companyId,
            clientId: req.params.clientId,
            orderStatus: { $in: ['pending', 'partially_delivered'] }
        }).sort({ orderDate: -1, createdAt: -1 }).lean();

        res.json(salesOrders);
    } catch (error) {
        console.error('Get pending sales orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create sales order
router.post('/', authenticate, requirePermission('canManageSales'), [
    body('clientName').trim().isLength({ min: 2 }).withMessage('Client name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;

        const {
            clientId,
            clientName,
            clientPhone,
            clientEmail,
            items,
            wages,
            totalAmount,
            orderDate,
            paymentTerms,
            dueDate,
            notes,
            paymentType  // 'cash' or 'credit'
        } = req.body;

        // Validate items exist
        for (const item of items) {
            const stockItem = await StockItem.findOne({
                _id: item.itemId,
                companyId
            });

            if (!stockItem) {
                return res.status(404).json({ message: `Item ${item.itemName} not found` });
            }
        }

        // Get or create client
        let client;
        if (clientId) {
            client = await Client.findOne({ _id: clientId, companyId });
        }

        if (!client && clientName) {
            client = new Client({
                companyId,
                name: clientName,
                phone: clientPhone,
                email: clientEmail
            });
            await client.save();
        }

        // Calculate payment fields based on payment type
        let paymentStatus, amountPaid, amountDue;

        if (paymentType === 'cash') {
            // Cash payment: mark as fully paid
            paymentStatus = 'paid';
            amountPaid = totalAmount;
            amountDue = 0;
        } else {
            // Credit payment: mark as pending
            paymentStatus = 'pending';
            amountPaid = 0;
            amountDue = totalAmount;
        }

        // Generate unique order number
        let salesOrder;
        let retries = 5;

        while (retries > 0) {
            try {
                const lastOrder = await SalesOrder.findOne({ companyId })
                    .sort({ orderNumber: -1 })
                    .select('orderNumber')
                    .lean();

                const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

                salesOrder = new SalesOrder({
                    companyId,
                    orderNumber: nextOrderNumber,
                    clientId: client?._id,
                    clientName,
                    clientPhone,
                    clientEmail,
                    items: items.map(item => ({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: item.quantity,
                        deliveredQuantity: 0,
                        sellingPrice: item.sellingPrice,
                        total: item.total
                    })),
                    wages: wages || 0,
                    totalAmount,
                    paymentStatus,
                    amountPaid,
                    amountDue,
                    orderStatus: 'pending',
                    orderDate: orderDate || new Date(),
                    paymentTerms,
                    dueDate,
                    notes,
                    staffName: req.user.fullName,
                    createdBy: req.user._id
                });

                await salesOrder.save();
                break;
            } catch (error) {
                if (error.code === 11000 && retries > 1) {
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 50));
                    continue;
                } else {
                    throw error;
                }
            }
        }

        if (!salesOrder) {
            return res.status(500).json({ message: 'Failed to generate unique order number' });
        }

        // Update client statistics (order count only, not revenue)
        if (client) {
            client.salesCount = (client.salesCount || 0) + 1;
            await client.save();
        }

        // Create journal entry for accounting (non-blocking)
        try {
            // Check if accounts are initialized, if not, initialize them
            const accountCount = await LedgerAccount.countDocuments({ companyId });
            if (accountCount === 0) {
                await initializeDefaultAccounts(companyId);
            }

            if (paymentType === 'cash') {
                // Cash sale: Debit Cash, Credit Sales Revenue
                await createJournalEntry({
                    companyId,
                    entryDate: salesOrder.orderDate,
                    entryType: 'cash_sale',
                    referenceType: 'SalesOrder',
                    referenceId: salesOrder._id,
                    description: `Cash sale - Order #${salesOrder.orderNumber} - ${salesOrder.clientName}`,
                    lines: [
                        { accountName: 'Cash', debit: totalAmount, credit: 0 },
                        { accountName: 'Sales Revenue', debit: 0, credit: totalAmount }
                    ],
                    createdBy: req.user._id
                });
            } else {
                // Credit sale: Debit Accounts Receivable, Credit Sales Revenue
                await createJournalEntry({
                    companyId,
                    entryDate: salesOrder.orderDate,
                    entryType: 'credit_sale',
                    referenceType: 'SalesOrder',
                    referenceId: salesOrder._id,
                    description: `Credit sale - Order #${salesOrder.orderNumber} - ${salesOrder.clientName}`,
                    lines: [
                        { accountName: 'Accounts Receivable', debit: totalAmount, credit: 0 },
                        { accountName: 'Sales Revenue', debit: 0, credit: totalAmount }
                    ],
                    createdBy: req.user._id
                });
            }
        } catch (journalError) {
            console.error('Journal entry creation error:', journalError);
            // Don't fail the sales order if journal entry fails
        }

        res.status(201).json({
            message: 'Sales order created successfully',
            salesOrder
        });
    } catch (error) {
        console.error('Create sales order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update sales order
router.put('/:id', authenticate, requirePermission('canManageSales'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const salesOrder = await SalesOrder.findOne({
            _id: req.params.id,
            companyId
        });

        if (!salesOrder) {
            return res.status(404).json({ message: 'Sales order not found' });
        }

        // Prevent editing if fully delivered
        if (salesOrder.orderStatus === 'completed') {
            return res.status(400).json({ message: 'Cannot edit completed sales order' });
        }

        const { clientName, clientPhone, clientEmail, items, wages, totalAmount, paymentTerms, dueDate, notes } = req.body;

        if (clientName) salesOrder.clientName = clientName;
        if (clientPhone) salesOrder.clientPhone = clientPhone;
        if (clientEmail) salesOrder.clientEmail = clientEmail;
        if (items) {
            // Preserve delivered quantities
            salesOrder.items = items.map(item => {
                const existingItem = salesOrder.items.find(i => i.itemId.toString() === item.itemId);
                return {
                    itemId: item.itemId,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    deliveredQuantity: existingItem?.deliveredQuantity || 0,
                    sellingPrice: item.sellingPrice,
                    total: item.total
                };
            });
        }
        if (wages !== undefined) salesOrder.wages = wages;
        if (totalAmount) salesOrder.totalAmount = totalAmount;
        if (paymentTerms) salesOrder.paymentTerms = paymentTerms;
        if (dueDate) salesOrder.dueDate = dueDate;
        if (notes !== undefined) salesOrder.notes = notes;

        await salesOrder.save();

        res.json({
            message: 'Sales order updated successfully',
            salesOrder
        });
    } catch (error) {
        console.error('Update sales order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete sales order
router.delete('/:id', authenticate, requirePermission('canManageSales'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const salesOrder = await SalesOrder.findOne({
            _id: req.params.id,
            companyId
        });

        if (!salesOrder) {
            return res.status(404).json({ message: 'Sales order not found' });
        }

        // Prevent deletion if deliveries exist
        if (salesOrder.linkedDeliveries && salesOrder.linkedDeliveries.length > 0) {
            return res.status(400).json({ message: 'Cannot delete sales order with linked deliveries' });
        }

        await SalesOrder.deleteOne({ _id: req.params.id });

        res.json({ message: 'Sales order deleted successfully' });
    } catch (error) {
        console.error('Delete sales order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
