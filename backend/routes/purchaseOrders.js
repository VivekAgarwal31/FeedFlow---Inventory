import express from 'express';
import { body, validationResult } from 'express-validator';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import StockItem from '../models/StockItem.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all purchase orders with pagination and filters
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

        if (req.query.supplierId) {
            filter.supplierId = req.query.supplierId;
        }

        if (req.query.startDate || req.query.endDate) {
            filter.orderDate = {};
            if (req.query.startDate) filter.orderDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.orderDate.$lte = new Date(req.query.endDate);
        }

        const purchaseOrders = await PurchaseOrder.find(filter)
            .sort({ orderDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await PurchaseOrder.countDocuments(filter);

        res.json({
            purchaseOrders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get purchase orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single purchase order with receipt history
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            companyId
        }).populate('linkedDeliveries').lean();

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        res.json(purchaseOrder);
    } catch (error) {
        console.error('Get purchase order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending purchase orders for a specific supplier
router.get('/pending/:supplierId', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const purchaseOrders = await PurchaseOrder.find({
            companyId,
            supplierId: req.params.supplierId,
            orderStatus: { $in: ['pending', 'partially_received'] }
        }).sort({ orderDate: -1, createdAt: -1 }).lean();

        res.json(purchaseOrders);
    } catch (error) {
        console.error('Get pending purchase orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create purchase order
router.post('/', authenticate, requirePermission('canManagePurchases'), [
    body('supplierId').notEmpty().withMessage('Supplier is required'),
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
            supplierId,
            supplierName,
            items,
            totalAmount,
            orderDate,
            expectedDeliveryDate,
            dueDate,
            notes
        } = req.body;

        // Validate supplier exists
        const supplier = await Supplier.findOne({ _id: supplierId, companyId });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

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

        // Generate unique order number
        let purchaseOrder;
        let retries = 5;

        while (retries > 0) {
            try {
                const lastOrder = await PurchaseOrder.findOne({ companyId })
                    .sort({ orderNumber: -1 })
                    .select('orderNumber')
                    .lean();

                const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

                purchaseOrder = new PurchaseOrder({
                    companyId,
                    orderNumber: nextOrderNumber,
                    supplierId,
                    supplierName: supplierName || supplier.name,
                    items: items.map(item => ({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: item.quantity,
                        receivedQuantity: 0,
                        costPrice: item.costPrice,
                        total: item.total
                    })),
                    totalAmount,
                    orderStatus: 'pending',
                    orderDate: orderDate || new Date(),
                    expectedDeliveryDate,
                    dueDate,
                    notes,
                    staffName: req.user.fullName,
                    createdBy: req.user._id
                });

                await purchaseOrder.save();
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

        if (!purchaseOrder) {
            return res.status(500).json({ message: 'Failed to generate unique order number' });
        }

        // Update supplier statistics
        supplier.purchaseCount = (supplier.purchaseCount || 0) + 1;
        supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;
        supplier.lastPurchaseDate = purchaseOrder.orderDate || new Date();
        await supplier.save();

        res.status(201).json({
            message: 'Purchase order created successfully',
            purchaseOrder
        });
    } catch (error) {
        console.error('Create purchase order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update purchase order
router.put('/:id', authenticate, requirePermission('canManagePurchases'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            companyId
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // Prevent editing if fully received
        if (purchaseOrder.orderStatus === 'completed') {
            return res.status(400).json({ message: 'Cannot edit completed purchase order' });
        }

        const { supplierName, items, totalAmount, expectedDeliveryDate, dueDate, notes } = req.body;

        if (supplierName) purchaseOrder.supplierName = supplierName;
        if (items) {
            // Preserve received quantities
            purchaseOrder.items = items.map(item => {
                const existingItem = purchaseOrder.items.find(i => i.itemId.toString() === item.itemId);
                return {
                    itemId: item.itemId,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    receivedQuantity: existingItem?.receivedQuantity || 0,
                    costPrice: item.costPrice,
                    total: item.total
                };
            });
        }
        if (totalAmount) purchaseOrder.totalAmount = totalAmount;
        if (expectedDeliveryDate) purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
        if (dueDate) purchaseOrder.dueDate = dueDate;
        if (notes !== undefined) purchaseOrder.notes = notes;

        await purchaseOrder.save();

        res.json({
            message: 'Purchase order updated successfully',
            purchaseOrder
        });
    } catch (error) {
        console.error('Update purchase order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete purchase order
router.delete('/:id', authenticate, requirePermission('canManagePurchases'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            companyId
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        // Prevent deletion if receipts exist
        if (purchaseOrder.linkedDeliveries && purchaseOrder.linkedDeliveries.length > 0) {
            return res.status(400).json({ message: 'Cannot delete purchase order with linked deliveries' });
        }

        await PurchaseOrder.deleteOne({ _id: req.params.id });

        res.json({ message: 'Purchase order deleted successfully' });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
