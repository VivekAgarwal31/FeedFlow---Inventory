import express from 'express';
import { body, validationResult } from 'express-validator';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import Warehouse from '../models/Warehouse.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all stock items
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const stockItems = await StockItem.find({ companyId })
            .populate('warehouseId')
            .sort({ itemName: 1 })
            .lean();

        res.json({ stockItems });
    } catch (error) {
        console.error('Get stock items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new stock item
router.post('/', authenticate, [
    body('itemName').trim().isLength({ min: 2 }).withMessage('Item name is required'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('bagSize').isFloat({ min: 0.01 }).withMessage('Bag size must be greater than 0'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
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

        const { itemName, category, itemCategory, bagSize, warehouseId, quantity, costPrice, sellingPrice, lowStockAlert, notes } = req.body;

        // Create stock item
        const stockItem = new StockItem({
            companyId,
            warehouseId,
            itemName,
            category: category || 'finished_product',
            itemCategory: itemCategory || '',
            bagSize,
            quantity: quantity || 0,
            costPrice: costPrice || 0,
            sellingPrice: sellingPrice || 0,
            lowStockAlert: lowStockAlert || 10
        });

        await stockItem.save();

        // If initial quantity > 0, create a stock transaction
        if (quantity && quantity > 0) {
            const warehouse = await Warehouse.findById(warehouseId);
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_in',
                itemId: stockItem._id,
                itemName: stockItem.itemName,
                warehouseId,
                warehouseName: warehouse?.name || 'Unknown',
                quantity,
                reason: notes || 'Initial stock creation',
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        // Populate warehouse info before sending response
        await stockItem.populate('warehouseId');

        res.status(201).json({
            message: 'Stock item created successfully',
            stockItem
        });
    } catch (error) {
        console.error('Create stock item error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Stock In operation
router.post('/in', authenticate, [
    body('itemId').notEmpty().withMessage('Item is required'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { itemId, warehouseId, quantity, reason, notes } = req.body;

        // Update stock
        const stockItem = await StockItem.findOneAndUpdate(
            { _id: itemId, companyId },
            { $inc: { quantity: quantity } },
            { new: true }
        ).populate('warehouseId');

        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }

        // Create transaction
        const transaction = new StockTransaction({
            companyId,
            type: 'stock_in',
            itemId,
            itemName: stockItem.itemName,
            warehouseId,
            warehouseName: stockItem.warehouseId?.name || 'Unknown',
            quantity,
            reason: reason || 'Stock added',
            notes,
            performedBy: req.user._id
        });

        await transaction.save();

        res.json({
            message: 'Stock added successfully',
            stockItem,
            transaction
        });
    } catch (error) {
        console.error('Stock in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Out operation
router.post('/out', authenticate, [
    body('itemId').notEmpty().withMessage('Item is required'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { itemId, warehouseId, quantity, reason, notes } = req.body;

        // Check current stock
        const stockItem = await StockItem.findOne({ _id: itemId, companyId }).populate('warehouseId');

        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }

        if (stockItem.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock quantity' });
        }

        // Update stock
        stockItem.quantity -= quantity;
        await stockItem.save();

        // Create transaction
        const transaction = new StockTransaction({
            companyId,
            type: 'stock_out',
            itemId,
            itemName: stockItem.itemName,
            warehouseId,
            warehouseName: stockItem.warehouseId?.name || 'Unknown',
            quantity: -quantity,
            reason: reason || 'Stock removed',
            notes,
            performedBy: req.user._id
        });

        await transaction.save();

        res.json({
            message: 'Stock removed successfully',
            stockItem,
            transaction
        });
    } catch (error) {
        console.error('Stock out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Move operation
router.post('/move', authenticate, [
    body('itemId').notEmpty().withMessage('Item is required'),
    body('fromWarehouseId').notEmpty().withMessage('Source warehouse is required'),
    body('toWarehouseId').notEmpty().withMessage('Destination warehouse is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { itemId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: 'Source and destination warehouses must be different' });
        }

        // Find stock items in both warehouses
        const fromStock = await StockItem.findOne({ _id: itemId, companyId, warehouseId: fromWarehouseId }).populate('warehouseId');

        if (!fromStock) {
            return res.status(404).json({ message: 'Stock item not found in source warehouse' });
        }

        if (fromStock.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock in source warehouse' });
        }

        // Update source warehouse stock
        fromStock.quantity -= quantity;
        await fromStock.save();

        // Find existing stock in destination warehouse by matching item properties
        // This prevents creating duplicate items with the same name
        let toStock = await StockItem.findOne({
            companyId,
            warehouseId: toWarehouseId,
            itemName: fromStock.itemName,
            bagSize: fromStock.bagSize,
            category: fromStock.category
        });

        if (toStock) {
            // Update existing stock in destination warehouse
            toStock.quantity += quantity;
            await toStock.save();
        } else {
            // Create new stock item in destination warehouse
            toStock = new StockItem({
                companyId,
                warehouseId: toWarehouseId,
                itemName: fromStock.itemName,
                category: fromStock.category,
                itemCategory: fromStock.itemCategory,
                bagSize: fromStock.bagSize,
                quantity: quantity,
                costPrice: fromStock.costPrice,
                sellingPrice: fromStock.sellingPrice,
                lowStockAlert: fromStock.lowStockAlert
            });
            await toStock.save();
        }

        // Fetch destination warehouse name
        const toWarehouse = await Warehouse.findById(toWarehouseId);
        const toWarehouseName = toWarehouse?.name || 'Unknown';

        // Create transaction
        const transaction = new StockTransaction({
            companyId,
            type: 'stock_move',
            itemId,
            itemName: fromStock.itemName,
            warehouseId: fromWarehouseId,
            warehouseName: fromStock.warehouseId?.name || 'Unknown',
            toWarehouseId,
            toWarehouseName,
            quantity,
            reason: `Moved from ${fromStock.warehouseId?.name || 'Unknown'} to ${toWarehouseName}`,
            notes,
            performedBy: req.user._id
        });

        await transaction.save();

        res.json({
            message: 'Stock moved successfully',
            fromStock,
            toStock,
            transaction
        });
    } catch (error) {
        console.error('Stock move error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Adjust operation
router.post('/adjust', authenticate, [
    body('itemId').notEmpty().withMessage('Item is required'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('newQuantity').isInt({ min: 0 }).withMessage('New quantity must be 0 or greater')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { itemId, warehouseId, newQuantity, reason, notes } = req.body;

        // Get current stock
        const stockItem = await StockItem.findOne({ _id: itemId, companyId }).populate('warehouseId');

        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }

        const oldQuantity = stockItem.quantity;
        const difference = newQuantity - oldQuantity;

        // Update stock
        stockItem.quantity = newQuantity;
        await stockItem.save();

        // Create transaction
        const transaction = new StockTransaction({
            companyId,
            type: 'stock_adjust',
            itemId,
            itemName: stockItem.itemName,
            warehouseId,
            warehouseName: stockItem.warehouseId?.name || 'Unknown',
            quantity: difference,
            reason: reason || `Adjusted from ${oldQuantity} to ${newQuantity}`,
            notes,
            performedBy: req.user._id
        });

        await transaction.save();

        res.json({
            message: 'Stock adjusted successfully',
            stockItem,
            transaction
        });
    } catch (error) {
        console.error('Stock adjust error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete stock item
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the stock item
        const stockItem = await StockItem.findOne({
            _id: req.params.id,
            companyId
        });

        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }

        // Delete the stock item (no quantity check - user requested removal of safety feature)
        await StockItem.findByIdAndDelete(req.params.id);

        // Delete associated transactions
        await StockTransaction.deleteMany({
            itemId: req.params.id
        });

        res.json({
            message: 'Stock item deleted successfully',
            deletedItem: {
                id: stockItem._id,
                itemName: stockItem.itemName
            }
        });
    } catch (error) {
        console.error('Delete stock item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
