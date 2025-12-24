import express from 'express';
import { body, validationResult } from 'express-validator';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import Warehouse from '../models/Warehouse.js';
import Purchase from '../models/Purchase.js';
import Sale from '../models/Sale.js';
import Supplier from '../models/Supplier.js';
import Client from '../models/Client.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

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
router.post('/', authenticate, requirePermission('canManageInventory'), [
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

        // Get all warehouses for this company
        const allWarehouses = await Warehouse.find({ companyId });

        if (allWarehouses.length === 0) {
            return res.status(400).json({ message: 'No warehouses found for this company' });
        }

        const createdStockItems = [];
        let primaryStockItem = null;

        // Create stock item for each warehouse
        for (const warehouse of allWarehouses) {
            const isSelectedWarehouse = warehouse._id.toString() === warehouseId;
            const itemQuantity = isSelectedWarehouse ? (quantity || 0) : 0;

            const stockItem = new StockItem({
                companyId,
                warehouseId: warehouse._id,
                itemName,
                category: category || 'finished_product',
                itemCategory: itemCategory || '',
                bagSize,
                quantity: itemQuantity,
                costPrice: costPrice || 0,
                sellingPrice: sellingPrice || 0,
                lowStockAlert: lowStockAlert || 10
            });

            await stockItem.save();
            createdStockItems.push(stockItem);

            // Keep track of the primary stock item (the one with initial quantity)
            if (isSelectedWarehouse) {
                primaryStockItem = stockItem;
            }
        }

        // If initial quantity > 0, create a stock transaction for the selected warehouse
        if (quantity && quantity > 0) {
            const warehouse = await Warehouse.findById(warehouseId);
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_in',
                itemId: primaryStockItem._id,
                itemName: primaryStockItem.itemName,
                warehouseId,
                warehouseName: warehouse?.name || 'Unknown',
                quantity,
                reason: notes || 'Initial stock creation',
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        // Populate warehouse info for the primary stock item before sending response
        await primaryStockItem.populate('warehouseId');

        res.status(201).json({
            message: `Stock item created successfully in ${allWarehouses.length} warehouse(s)`,
            stockItem: primaryStockItem,
            totalWarehouses: allWarehouses.length
        });
    } catch (error) {
        console.error('Create stock item error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Stock In operation
router.post('/in', authenticate, requirePermission('canManageInventory'), [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('reason').optional().isIn(['purchase', 'other']).withMessage('Invalid reason'),
    body('supplierId').if(body('reason').equals('purchase')).notEmpty().withMessage('Supplier is required when reason is purchase'),
    body('supplierName').if(body('reason').equals('purchase')).notEmpty().withMessage('Supplier name is required when reason is purchase')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { items, warehouseId, reason, supplierId, supplierName, referenceNumber, notes } = req.body;

        const updatedItems = [];
        let totalQuantity = 0;
        const itemsForTransaction = [];

        // Process each item
        for (const item of items) {
            const { itemId, quantity } = item;

            // Update stock
            const stockItem = await StockItem.findOneAndUpdate(
                { _id: itemId, companyId },
                { $inc: { quantity: quantity } },
                { new: true }
            ).populate('warehouseId');

            if (!stockItem) {
                return res.status(404).json({ message: `Stock item ${itemId} not found` });
            }

            updatedItems.push(stockItem);
            totalQuantity += quantity;

            itemsForTransaction.push({
                itemId,
                itemName: stockItem.itemName,
                quantity
            });
        }

        // Get warehouse info
        const warehouse = await Warehouse.findById(warehouseId);
        const warehouseName = warehouse?.name || 'Unknown';

        // Create Purchase record if reason is 'purchase'
        let purchaseId = null;
        if (reason === 'purchase' && supplierId) {
            const purchase = new Purchase({
                companyId,
                supplierId,
                supplierName,
                items: items.map((item, index) => ({
                    itemId: item.itemId,
                    itemName: itemsForTransaction[index].itemName,
                    warehouseId,
                    warehouseName,
                    quantity: item.quantity,
                    costPrice: 0, // Default to 0
                    total: 0
                })),
                totalAmount: 0,
                paymentStatus: 'pending',
                purchaseDate: new Date(),
                notes: notes || `Stock In${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`
            });
            await purchase.save();
            purchaseId = purchase._id;

            // Update supplier statistics
            await Supplier.findByIdAndUpdate(supplierId, {
                $inc: {
                    totalPurchases: 0,
                    purchaseCount: 1
                },
                $set: {
                    lastPurchaseDate: new Date()
                }
            });
        }

        // Create single or consolidated transaction based on item count
        if (items.length === 1) {
            // Single item - create traditional transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_in',
                itemId: items[0].itemId,
                itemName: itemsForTransaction[0].itemName,
                warehouseId,
                warehouseName,
                quantity: items[0].quantity,
                reason: reason === 'purchase' ? `Purchase from ${supplierName}` : (supplierName || 'Stock added'),
                notes: notes || (supplierName && reason !== 'purchase' ? `Supplier: ${supplierName}${referenceNumber ? `, Ref: ${referenceNumber}` : ''}` : ''),
                referenceId: purchaseId,
                referenceModel: purchaseId ? 'Purchase' : undefined,
                performedBy: req.user._id
            });
            await transaction.save();
        } else {
            // Multiple items - create consolidated transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_in',
                itemId: items[0].itemId, // Use first item as primary reference
                itemName: `${items.length} items`,
                warehouseId,
                warehouseName,
                quantity: totalQuantity,
                items: itemsForTransaction,
                reason: reason === 'purchase' ? `Purchase from ${supplierName}` : (supplierName || 'Stock added'),
                notes: notes || (supplierName && reason !== 'purchase' ? `Supplier: ${supplierName}${referenceNumber ? `, Ref: ${referenceNumber}` : ''}` : ''),
                referenceId: purchaseId,
                referenceModel: purchaseId ? 'Purchase' : undefined,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        res.json({
            message: `Stock added successfully for ${items.length} item(s)${purchaseId ? ' and purchase record created' : ''}`,
            stockItems: updatedItems,
            purchaseId
        });
    } catch (error) {
        console.error('Stock in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Out operation
router.post('/out', authenticate, requirePermission('canManageInventory'), [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required'),
    body('reason').optional().isIn(['sale', 'damaged', 'expired', 'other']).withMessage('Invalid reason'),
    body('clientId').if(body('reason').equals('sale')).notEmpty().withMessage('Client is required when reason is sale'),
    body('clientName').if(body('reason').equals('sale')).notEmpty().withMessage('Client name is required when reason is sale')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { items, warehouseId, reason, clientId, clientName, recipientName, referenceNumber, notes } = req.body;

        const updatedItems = [];
        let totalQuantity = 0;
        const itemsForTransaction = [];

        // Process each item
        for (const item of items) {
            const { itemId, quantity } = item;

            // Check current stock
            const stockItem = await StockItem.findOne({ _id: itemId, companyId }).populate('warehouseId');

            if (!stockItem) {
                return res.status(404).json({ message: `Stock item ${itemId} not found` });
            }

            // Update stock (allow negative quantities)
            stockItem.quantity -= quantity;
            await stockItem.save();

            updatedItems.push(stockItem);
            totalQuantity += quantity;

            itemsForTransaction.push({
                itemId,
                itemName: stockItem.itemName,
                quantity
            });
        }

        // Get warehouse info
        const warehouse = await Warehouse.findById(warehouseId);
        const warehouseName = warehouse?.name || 'Unknown';

        // Create Sale record if reason is 'sale'
        let saleId = null;
        if (reason === 'sale' && clientId) {
            const sale = new Sale({
                companyId,
                clientId,
                clientName,
                items: items.map((item, index) => ({
                    itemId: item.itemId,
                    itemName: itemsForTransaction[index].itemName,
                    warehouseId,
                    warehouseName,
                    quantity: item.quantity,
                    unitPrice: 0, // Default to 0
                    sellingPrice: 0, // Default to 0 - required by Sale model
                    total: 0
                })),
                totalAmount: 0,
                paymentStatus: 'pending',
                saleDate: new Date(),
                notes: notes || `Stock Out${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`
            });
            await sale.save();
            saleId = sale._id;

            // Update client statistics
            await Client.findByIdAndUpdate(clientId, {
                $inc: {
                    totalRevenue: 0,
                    saleCount: 1
                },
                $set: {
                    lastPurchaseDate: new Date()
                }
            });
        }

        // Create single or consolidated transaction based on item count
        if (items.length === 1) {
            // Single item - create traditional transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_out',
                itemId: items[0].itemId,
                itemName: itemsForTransaction[0].itemName,
                warehouseId,
                warehouseName,
                quantity: -items[0].quantity,
                reason: reason === 'sale' ? `Sale to ${clientName}` : (reason || 'Stock removed'),
                notes: notes || (recipientName && reason !== 'sale' ? `Recipient: ${recipientName}${referenceNumber ? `, Ref: ${referenceNumber}` : ''}` : ''),
                referenceId: saleId,
                referenceModel: saleId ? 'Sale' : undefined,
                performedBy: req.user._id
            });
            await transaction.save();
        } else {
            // Multiple items - create consolidated transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_out',
                itemId: items[0].itemId,
                itemName: `${items.length} items`,
                warehouseId,
                warehouseName,
                quantity: -totalQuantity,
                items: itemsForTransaction,
                reason: reason === 'sale' ? `Sale to ${clientName}` : (reason || 'Stock removed'),
                notes: notes || (recipientName && reason !== 'sale' ? `Recipient: ${recipientName}${referenceNumber ? `, Ref: ${referenceNumber}` : ''}` : ''),
                referenceId: saleId,
                referenceModel: saleId ? 'Sale' : undefined,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        res.json({
            message: `Stock removed successfully for ${items.length} item(s)${saleId ? ' and sale record created' : ''}`,
            stockItems: updatedItems,
            saleId
        });
    } catch (error) {
        console.error('Stock out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Move operation
router.post('/move', authenticate, requirePermission('canManageInventory'), [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('fromWarehouseId').notEmpty().withMessage('Source warehouse is required'),
    body('toWarehouseId').notEmpty().withMessage('Destination warehouse is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { items, fromWarehouseId, toWarehouseId, notes } = req.body;

        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: 'Source and destination warehouses must be different' });
        }

        const movedItems = [];
        let totalQuantity = 0;
        const itemsForTransaction = [];

        // Fetch warehouses
        const fromWarehouse = await Warehouse.findById(fromWarehouseId);
        const toWarehouse = await Warehouse.findById(toWarehouseId);
        const fromWarehouseName = fromWarehouse?.name || 'Unknown';
        const toWarehouseName = toWarehouse?.name || 'Unknown';

        // Process each item
        for (const item of items) {
            const { itemId, quantity } = item;

            // Find stock items in both warehouses
            const fromStock = await StockItem.findOne({ _id: itemId, companyId, warehouseId: fromWarehouseId }).populate('warehouseId');

            if (!fromStock) {
                return res.status(404).json({ message: `Stock item ${itemId} not found in source warehouse` });
            }

            // Update source warehouse stock (allow negative quantities)
            fromStock.quantity -= quantity;
            await fromStock.save();

            // Find existing stock in destination warehouse by matching item properties
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

            movedItems.push({ fromStock, toStock });
            totalQuantity += quantity;

            itemsForTransaction.push({
                itemId,
                itemName: fromStock.itemName,
                quantity
            });
        }

        // Create single or consolidated transaction based on item count
        if (items.length === 1) {
            // Single item - create traditional transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_move',
                itemId: items[0].itemId,
                itemName: itemsForTransaction[0].itemName,
                warehouseId: fromWarehouseId,
                warehouseName: fromWarehouseName,
                toWarehouseId,
                toWarehouseName,
                quantity: items[0].quantity,
                reason: `Moved from ${fromWarehouseName} to ${toWarehouseName}`,
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        } else {
            // Multiple items - create consolidated transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'stock_move',
                itemId: items[0].itemId, // Use first item as primary reference
                itemName: `${items.length} items`,
                warehouseId: fromWarehouseId,
                warehouseName: fromWarehouseName,
                toWarehouseId,
                toWarehouseName,
                quantity: totalQuantity,
                items: itemsForTransaction,
                reason: `Moved from ${fromWarehouseName} to ${toWarehouseName}`,
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        res.json({
            message: `Stock moved successfully for ${items.length} item(s)`,
            movedItems
        });
    } catch (error) {
        console.error('Stock move error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Stock Adjust operation
router.post('/adjust', authenticate, requirePermission('canManageInventory'), [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item is required'),
    body('items.*.adjustmentType').isIn(['increase', 'decrease']).withMessage('Adjustment type must be increase or decrease'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('warehouseId').notEmpty().withMessage('Warehouse is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { items, warehouseId, reason, notes } = req.body;

        const updatedItems = [];
        let totalQuantity = 0;
        const itemsForTransaction = [];

        // Process each item
        for (const item of items) {
            const { itemId, adjustmentType, quantity } = item;

            // Get current stock
            const stockItem = await StockItem.findOne({ _id: itemId, companyId }).populate('warehouseId');

            if (!stockItem) {
                return res.status(404).json({ message: `Stock item ${itemId} not found` });
            }

            const oldQuantity = stockItem.quantity;
            const difference = adjustmentType === 'increase' ? quantity : -quantity;
            const newQuantity = oldQuantity + difference;

            // Update stock
            stockItem.quantity = newQuantity;
            await stockItem.save();

            updatedItems.push(stockItem);
            totalQuantity += Math.abs(difference);

            itemsForTransaction.push({
                itemId,
                itemName: stockItem.itemName,
                quantity: Math.abs(difference),
                adjustmentType
            });
        }

        // Get warehouse info
        const warehouse = await Warehouse.findById(warehouseId);
        const warehouseName = warehouse?.name || 'Unknown';

        // Create single or consolidated transaction based on item count
        if (items.length === 1) {
            // Single item - create traditional transaction
            const item = items[0];
            const difference = item.adjustmentType === 'increase' ? item.quantity : -item.quantity;

            const transaction = new StockTransaction({
                companyId,
                type: 'stock_adjust',
                itemId: item.itemId,
                itemName: itemsForTransaction[0].itemName,
                warehouseId,
                warehouseName,
                quantity: difference,
                reason: reason || 'Stock adjustment',
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        } else {
            // Multiple items - create consolidated transaction
            // Calculate net adjustment (increases - decreases)
            const netAdjustment = items.reduce((sum, item) => {
                return sum + (item.adjustmentType === 'increase' ? item.quantity : -item.quantity);
            }, 0);

            const transaction = new StockTransaction({
                companyId,
                type: 'stock_adjust',
                itemId: items[0].itemId,
                itemName: `${items.length} items`,
                warehouseId,
                warehouseName,
                quantity: netAdjustment,
                items: itemsForTransaction,
                reason: reason || 'Stock adjustment',
                notes,
                performedBy: req.user._id
            });
            await transaction.save();
        }

        res.json({
            message: `Stock adjusted successfully for ${items.length} item(s)`,
            stockItems: updatedItems
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
