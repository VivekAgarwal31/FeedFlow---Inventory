import express from 'express';
import { body, validationResult } from 'express-validator';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all purchases with pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = { companyId };
        if (req.query.supplierId) {
            query.supplierId = req.query.supplierId;
        }

        const [purchases, total] = await Promise.all([
            Purchase.find(query)
                .sort({ purchaseDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Purchase.countDocuments(query)
        ]);

        res.json({
            purchases,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create purchase
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

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { supplierId, supplierName, invoiceNumber, items, totalAmount, paymentStatus, paymentMethod, notes, purchaseDate } = req.body;

        // Create purchase
        const purchase = new Purchase({
            companyId,
            supplierId,
            supplierName,
            invoiceNumber,
            items,
            totalAmount,
            paymentStatus: paymentStatus || 'pending',
            paymentMethod: paymentMethod || 'cash',
            notes,
            staffName: req.user.fullName,
            purchaseDate: purchaseDate || new Date()
        });

        await purchase.save();

        // Update stock quantities and create transactions
        let totalQuantity = 0;
        const itemsForTransaction = [];

        for (const item of items) {
            // Find stock item by ID (frontend sends the actual stock item ID)
            let stockItem = await StockItem.findOne({
                _id: item.itemId,
                companyId
            });

            if (!stockItem) {
                throw new Error(`Stock item not found: ${item.itemName}`);
            }

            // Update existing stock in this warehouse
            stockItem.quantity += item.quantity;

            // Update cost price if provided
            if (item.costPrice) {
                stockItem.costPrice = item.costPrice;
            }

            await stockItem.save();

            // Track for consolidated transaction
            totalQuantity += item.quantity;
            itemsForTransaction.push({
                itemId: stockItem._id,
                itemName: item.itemName,
                quantity: item.quantity
            });
        }

        // Create transactions per warehouse
        const warehouseTransactions = {};

        for (const item of items) {
            // Group items by warehouse
            if (!warehouseTransactions[item.warehouseId]) {
                warehouseTransactions[item.warehouseId] = {
                    warehouseId: item.warehouseId,
                    warehouseName: item.warehouseName,
                    items: [],
                    totalQuantity: 0
                };
            }

            warehouseTransactions[item.warehouseId].items.push(itemsForTransaction.find(i => i.itemName === item.itemName));
            warehouseTransactions[item.warehouseId].totalQuantity += item.quantity;
        }

        // Create transaction for each warehouse
        for (const warehouseId in warehouseTransactions) {
            const whData = warehouseTransactions[warehouseId];

            if (whData.items.length === 1) {
                // Single item in this warehouse
                const transaction = new StockTransaction({
                    companyId,
                    type: 'purchase',
                    itemId: whData.items[0].itemId,
                    itemName: whData.items[0].itemName,
                    warehouseId: whData.warehouseId,
                    warehouseName: whData.warehouseName,
                    quantity: whData.items[0].quantity,
                    referenceId: purchase._id,
                    referenceModel: 'Purchase',
                    reason: `Purchase from ${supplierName}`,
                    transactionDate: purchaseDate || new Date(),
                    performedBy: req.user._id,
                    staffName: req.user.fullName
                });
                await transaction.save();
            } else {
                // Multiple items in this warehouse
                const transaction = new StockTransaction({
                    companyId,
                    type: 'purchase',
                    itemId: whData.items[0].itemId,
                    itemName: `${whData.items.length} items`,
                    warehouseId: whData.warehouseId,
                    warehouseName: whData.warehouseName,
                    quantity: whData.totalQuantity,
                    items: whData.items,
                    referenceId: purchase._id,
                    referenceModel: 'Purchase',
                    reason: `Purchase from ${supplierName}`,
                    transactionDate: purchaseDate || new Date(),
                    performedBy: req.user._id,
                    staffName: req.user.fullName
                });
                await transaction.save();
            }
        }

        // Update supplier statistics
        await Supplier.findByIdAndUpdate(supplierId, {
            $inc: {
                totalPurchases: totalAmount,
                purchaseCount: 1
            },
            lastPurchaseDate: purchaseDate || new Date()
        });

        res.status(201).json({
            message: 'Purchase created successfully',
            purchase
        });
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete purchase
router.delete('/:id', authenticate, requirePermission('canManagePurchases'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const purchase = await Purchase.findOneAndDelete({
            _id: req.params.id,
            companyId
        });

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Restore stock quantities and delete associated transactions
        for (const item of purchase.items) {
            const stockItem = await StockItem.findById(item.itemId);
            if (stockItem) {
                // Deduct the purchased quantity (reverse the purchase)
                stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                await stockItem.save();
            }
        }

        // Delete associated stock transactions
        await StockTransaction.deleteMany({
            referenceId: purchase._id,
            referenceModel: 'Purchase'
        });

        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error('Delete purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
