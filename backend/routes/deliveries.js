import express from 'express';
import { body, validationResult } from 'express-validator';
import DeliveryOut from '../models/DeliveryOut.js';
import DeliveryIn from '../models/DeliveryIn.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import Warehouse from '../models/Warehouse.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// ==================== DELIVERY OUT (Sales) ====================

// Get all delivery outs with pagination
router.get('/out', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { companyId };

        if (req.query.clientName) {
            filter.clientName = { $regex: req.query.clientName, $options: 'i' };
        }

        if (req.query.startDate || req.query.endDate) {
            filter.deliveryDate = {};
            if (req.query.startDate) filter.deliveryDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.deliveryDate.$lte = new Date(req.query.endDate);
        }

        const deliveries = await DeliveryOut.find(filter)
            .sort({ deliveryDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await DeliveryOut.countDocuments(filter);

        res.json({
            deliveries,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get delivery outs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single delivery out
router.get('/out/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const delivery = await DeliveryOut.findOne({
            _id: req.params.id,
            companyId
        }).populate('salesOrderId').lean();

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        res.json(delivery);
    } catch (error) {
        console.error('Get delivery out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create delivery out
router.post('/out', authenticate, requirePermission('canManageSales'), [
    body('salesOrderId').notEmpty().withMessage('Sales order is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;

        const {
            salesOrderId,
            items,
            wages,
            deliveryDate,
            notes
        } = req.body;

        // Get sales order
        const salesOrder = await SalesOrder.findOne({
            _id: salesOrderId,
            companyId
        });

        if (!salesOrder) {
            return res.status(404).json({ message: 'Sales order not found' });
        }

        if (salesOrder.orderStatus === 'completed') {
            return res.status(400).json({ message: 'Sales order is already fully delivered' });
        }

        if (salesOrder.orderStatus === 'cancelled') {
            return res.status(400).json({ message: 'Cannot deliver cancelled sales order' });
        }

        // Validate delivery quantities
        let totalAmount = 0;
        for (const deliveryItem of items) {
            const orderItem = salesOrder.items.find(i => i.itemId.toString() === deliveryItem.itemId);

            if (!orderItem) {
                return res.status(400).json({ message: `Item ${deliveryItem.itemName} not in sales order` });
            }

            const remaining = orderItem.quantity - orderItem.deliveredQuantity;
            if (deliveryItem.quantity > remaining) {
                return res.status(400).json({
                    message: `Cannot deliver ${deliveryItem.quantity} of ${deliveryItem.itemName}. Only ${remaining} remaining.`
                });
            }

            // Verify stock availability
            const stockItem = await StockItem.findOne({
                itemName: deliveryItem.itemName,
                warehouseId: deliveryItem.warehouseId,
                companyId
            });

            if (!stockItem) {
                return res.status(404).json({ message: `Stock item ${deliveryItem.itemName} not found in warehouse` });
            }

            if (stockItem.quantity < deliveryItem.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${deliveryItem.itemName}. Available: ${stockItem.quantity}`
                });
            }

            totalAmount += deliveryItem.total;
        }

        totalAmount += (wages || 0);

        // Generate unique delivery number
        let delivery;
        let retries = 5;

        while (retries > 0) {
            try {
                const lastDelivery = await DeliveryOut.findOne({ companyId })
                    .sort({ deliveryNumber: -1 })
                    .select('deliveryNumber')
                    .lean();

                const nextDeliveryNumber = (lastDelivery?.deliveryNumber || 0) + 1;

                delivery = new DeliveryOut({
                    companyId,
                    deliveryNumber: nextDeliveryNumber,
                    salesOrderId: salesOrder._id,
                    salesOrderNumber: salesOrder.orderNumber,
                    clientId: salesOrder.clientId,
                    clientName: salesOrder.clientName,
                    clientPhone: salesOrder.clientPhone,
                    clientEmail: salesOrder.clientEmail,
                    items,
                    wages: wages || 0,
                    totalAmount,
                    deliveryDate: deliveryDate || new Date(),
                    deliveryStatus: 'completed',
                    notes,
                    staffName: req.user.fullName,
                    performedBy: req.user._id
                });

                await delivery.save();
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

        if (!delivery) {
            return res.status(500).json({ message: 'Failed to generate unique delivery number' });
        }

        // Update stock quantities and create transactions
        const itemsForTransaction = [];

        for (const item of items) {
            const stockItem = await StockItem.findOne({
                itemName: item.itemName,
                warehouseId: item.warehouseId,
                companyId
            });

            stockItem.quantity -= item.quantity;
            await stockItem.save();

            itemsForTransaction.push({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName
            });

            // Update delivered quantity in sales order
            const orderItem = salesOrder.items.find(i => i.itemId.toString() === item.itemId);
            orderItem.deliveredQuantity += item.quantity;
        }


        // Create single stock transaction for the delivery
        const uniqueWarehouses = new Set(items.map(item => item.warehouseId));
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        // Fetch warehouse names for all warehouses used
        const warehouseIds = [...uniqueWarehouses];
        const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } }).select('_id name').lean();
        const warehouseMap = new Map(warehouses.map(w => [w._id.toString(), w.name]));

        // Determine warehouse summary for display
        const warehouseNames = [...warehouseMap.values()];
        const warehouseSummary = warehouseNames.length === 1
            ? warehouseNames[0]
            : `${warehouseNames.length} warehouses`;

        const transaction = new StockTransaction({
            companyId,
            type: 'delivery_out',
            items: items.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: warehouseMap.get(item.warehouseId.toString()) || 'Unknown'
            })),
            warehouses: uniqueWarehouses.size,
            warehouseName: warehouseSummary,
            quantity: totalQuantity,
            referenceId: delivery._id,
            referenceModel: 'DeliveryOut',
            reason: `Delivery to ${salesOrder.clientName} (SO #${salesOrder.orderNumber})`,
            transactionDate: deliveryDate || new Date(),
            performedBy: req.user._id,
            staffName: req.user.fullName
        });
        await transaction.save();

        // Update sales order status and link delivery
        salesOrder.linkedDeliveries.push(delivery._id);
        salesOrder.updateOrderStatus();
        await salesOrder.save();

        // Update client financials
        if (salesOrder.clientId) {
            const client = await Client.findById(salesOrder.clientId);
            if (client) {
                client.totalPurchases = (client.totalPurchases || 0) + totalAmount;
                client.totalRevenue = (client.totalRevenue || 0) + totalAmount;
                client.lastPurchaseDate = deliveryDate || new Date();
                await client.save();
            }
        }

        res.status(201).json({
            message: 'Delivery created successfully',
            delivery,
            salesOrderStatus: salesOrder.orderStatus
        });
    } catch (error) {
        console.error('Create delivery out error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete delivery out (reverse delivery)
router.delete('/out/:id', authenticate, requirePermission('canManageSales'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const delivery = await DeliveryOut.findOne({
            _id: req.params.id,
            companyId
        });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Restore stock quantities
        for (const item of delivery.items) {
            // Find stock item by name, not by _id
            const stockItem = await StockItem.findOne({
                itemName: item.itemName,
                warehouseId: item.warehouseId,
                companyId
            });

            if (stockItem) {
                stockItem.quantity += item.quantity;
                await stockItem.save();
            }
        }

        // Update sales order
        if (delivery.salesOrderId) {
            const salesOrder = await SalesOrder.findById(delivery.salesOrderId);
            if (salesOrder) {
                // Aggregate quantities by itemId (in case of split items)
                const itemQuantities = {};
                for (const item of delivery.items) {
                    if (!itemQuantities[item.itemId]) {
                        itemQuantities[item.itemId] = 0;
                    }
                    itemQuantities[item.itemId] += item.quantity;
                }

                // Update delivered quantities in sales order
                for (const [itemId, totalQty] of Object.entries(itemQuantities)) {
                    const orderItem = salesOrder.items.find(i => i.itemId.toString() === itemId.toString());
                    if (orderItem) {
                        orderItem.deliveredQuantity = Math.max(0, orderItem.deliveredQuantity - totalQty);
                    }
                }

                salesOrder.linkedDeliveries = salesOrder.linkedDeliveries.filter(
                    d => d.toString() !== delivery._id.toString()
                );
                salesOrder.updateOrderStatus();
                await salesOrder.save();
            }
        }

        // Delete stock transactions
        await StockTransaction.deleteMany({
            referenceId: delivery._id,
            referenceModel: 'DeliveryOut'
        });

        // Update client financials
        if (delivery.clientId) {
            const client = await Client.findById(delivery.clientId);
            if (client) {
                client.totalPurchases = Math.max(0, (client.totalPurchases || 0) - delivery.totalAmount);
                client.totalRevenue = Math.max(0, (client.totalRevenue || 0) - delivery.totalAmount);
                await client.save();
            }
        }

        await DeliveryOut.deleteOne({ _id: req.params.id });

        res.json({ message: 'Delivery reversed successfully' });
    } catch (error) {
        console.error('Delete delivery out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== DELIVERY IN (Purchase) ====================

// Get all delivery ins with pagination
router.get('/in', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { companyId };

        if (req.query.supplierId) {
            filter.supplierId = req.query.supplierId;
        }

        if (req.query.startDate || req.query.endDate) {
            filter.receiptDate = {};
            if (req.query.startDate) filter.receiptDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.receiptDate.$lte = new Date(req.query.endDate);
        }

        const deliveries = await DeliveryIn.find(filter)
            .sort({ receiptDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await DeliveryIn.countDocuments(filter);

        res.json({
            deliveries,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get delivery ins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single delivery in
router.get('/in/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const delivery = await DeliveryIn.findOne({
            _id: req.params.id,
            companyId
        }).populate('purchaseOrderId').lean();

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        res.json(delivery);
    } catch (error) {
        console.error('Get delivery in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create delivery in
router.post('/in', authenticate, requirePermission('canManagePurchases'), [
    body('purchaseOrderId').notEmpty().withMessage('Purchase order is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;

        const {
            purchaseOrderId,
            items,
            receiptDate,
            notes
        } = req.body;

        // Get purchase order
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: purchaseOrderId,
            companyId
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        if (purchaseOrder.orderStatus === 'completed') {
            return res.status(400).json({ message: 'Purchase order is already fully received' });
        }

        if (purchaseOrder.orderStatus === 'cancelled') {
            return res.status(400).json({ message: 'Cannot receive cancelled purchase order' });
        }

        // Validate receipt quantities
        let totalAmount = 0;
        for (const receiptItem of items) {
            const orderItem = purchaseOrder.items.find(i => i.itemId.toString() === receiptItem.itemId);

            if (!orderItem) {
                return res.status(400).json({ message: `Item ${receiptItem.itemName} not in purchase order` });
            }

            const remaining = orderItem.quantity - orderItem.receivedQuantity;
            if (receiptItem.quantity > remaining) {
                return res.status(400).json({
                    message: `Cannot receive ${receiptItem.quantity} of ${receiptItem.itemName}. Only ${remaining} remaining.`
                });
            }

            totalAmount += receiptItem.total;
        }

        // Generate unique GRN number
        let delivery;
        let retries = 5;

        while (retries > 0) {
            try {
                const lastDelivery = await DeliveryIn.findOne({ companyId })
                    .sort({ grnNumber: -1 })
                    .select('grnNumber')
                    .lean();

                const nextGrnNumber = (lastDelivery?.grnNumber || 0) + 1;

                delivery = new DeliveryIn({
                    companyId,
                    grnNumber: nextGrnNumber,
                    purchaseOrderId: purchaseOrder._id,
                    purchaseOrderNumber: purchaseOrder.orderNumber,
                    supplierId: purchaseOrder.supplierId,
                    supplierName: purchaseOrder.supplierName,
                    items,
                    totalAmount,
                    receiptDate: receiptDate || new Date(),
                    receiptStatus: 'completed',
                    notes,
                    staffName: req.user.fullName,
                    performedBy: req.user._id
                });

                await delivery.save();
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

        if (!delivery) {
            return res.status(500).json({ message: 'Failed to generate unique GRN number' });
        }

        // Update stock quantities and create transactions
        const itemsForTransaction = [];

        for (const item of items) {
            // First, get the original item details to know the bagSize
            const originalItem = await StockItem.findOne({
                _id: item.itemId,
                companyId
            }).select('itemName bagSize category itemCategory costPrice sellingPrice lowStockAlert').lean();

            if (!originalItem) {
                console.error(`Original stock item not found for itemId: ${item.itemId}`);
                continue;
            }

            // Now find or create stock item in the target warehouse
            let stockItem = await StockItem.findOne({
                itemName: originalItem.itemName,
                bagSize: originalItem.bagSize,
                warehouseId: item.warehouseId,
                companyId
            });

            if (stockItem) {
                // Stock item exists in this warehouse, update quantity
                stockItem.quantity += item.quantity;
                await stockItem.save();
            } else {
                // Stock item doesn't exist in this warehouse, create it
                stockItem = new StockItem({
                    companyId,
                    warehouseId: item.warehouseId,
                    itemName: originalItem.itemName,
                    bagSize: originalItem.bagSize,
                    category: originalItem.category || 'finished_product',
                    itemCategory: originalItem.itemCategory || '',
                    quantity: item.quantity,
                    costPrice: item.costPrice || originalItem.costPrice || 0,
                    sellingPrice: originalItem.sellingPrice || 0,
                    lowStockAlert: originalItem.lowStockAlert || 10
                });
                await stockItem.save();
            }

            itemsForTransaction.push({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName
            });

            // Update received quantity in purchase order
            const orderItem = purchaseOrder.items.find(i => i.itemId.toString() === item.itemId);
            orderItem.receivedQuantity += item.quantity;
        }


        // Create single stock transaction for the delivery
        const uniqueWarehouses = new Set(items.map(item => item.warehouseId));
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        // Fetch warehouse names for all warehouses used
        const warehouseIds = [...uniqueWarehouses];
        const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } }).select('_id name').lean();
        const warehouseMap = new Map(warehouses.map(w => [w._id.toString(), w.name]));

        // Determine warehouse summary for display
        const warehouseNames = [...warehouseMap.values()];
        const warehouseSummary = warehouseNames.length === 1
            ? warehouseNames[0]
            : `${warehouseNames.length} warehouses`;

        const transaction = new StockTransaction({
            companyId,
            type: 'delivery_in',
            items: items.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: warehouseMap.get(item.warehouseId.toString()) || 'Unknown'
            })),
            warehouses: uniqueWarehouses.size,
            warehouseName: warehouseSummary,
            quantity: totalQuantity,
            referenceId: delivery._id,
            referenceModel: 'DeliveryIn',
            reason: `Receipt from ${purchaseOrder.supplierName} (PO #${purchaseOrder.orderNumber})`,
            transactionDate: receiptDate || new Date(),
            performedBy: req.user._id,
            staffName: req.user.fullName
        });
        await transaction.save();

        // Update purchase order status and link delivery
        purchaseOrder.linkedDeliveries.push(delivery._id);
        purchaseOrder.updateOrderStatus();
        await purchaseOrder.save();

        // Update supplier financials
        const supplier = await Supplier.findById(purchaseOrder.supplierId);
        if (supplier) {
            supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;
            supplier.currentPayable = (supplier.currentPayable || 0) + totalAmount;
            supplier.lastPurchaseDate = receiptDate || new Date();
            await supplier.save();
        }

        res.status(201).json({
            message: 'Delivery in created successfully',
            delivery,
            purchaseOrderStatus: purchaseOrder.orderStatus
        });
    } catch (error) {
        console.error('Create delivery in error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete delivery in (reverse receipt)
router.delete('/in/:id', authenticate, requirePermission('canManagePurchases'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const delivery = await DeliveryIn.findOne({
            _id: req.params.id,
            companyId
        });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Restore stock quantities
        for (const item of delivery.items) {
            // Find stock item by name and bagSize, not by _id
            const stockItem = await StockItem.findOne({
                itemName: item.itemName,
                warehouseId: item.warehouseId,
                companyId
            });

            if (stockItem) {
                stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                await stockItem.save();
            }
        }

        // Update purchase order
        if (delivery.purchaseOrderId) {
            const purchaseOrder = await PurchaseOrder.findById(delivery.purchaseOrderId);
            if (purchaseOrder) {
                // Aggregate quantities by itemId (in case of split items)
                const itemQuantities = {};
                for (const item of delivery.items) {
                    if (!itemQuantities[item.itemId]) {
                        itemQuantities[item.itemId] = 0;
                    }
                    itemQuantities[item.itemId] += item.quantity;
                }

                // Update received quantities in purchase order
                for (const [itemId, totalQty] of Object.entries(itemQuantities)) {
                    const orderItem = purchaseOrder.items.find(i => i.itemId.toString() === itemId.toString());
                    if (orderItem) {
                        orderItem.receivedQuantity = Math.max(0, orderItem.receivedQuantity - totalQty);
                    }
                }

                purchaseOrder.linkedDeliveries = purchaseOrder.linkedDeliveries.filter(
                    d => d.toString() !== delivery._id.toString()
                );
                purchaseOrder.updateOrderStatus();
                await purchaseOrder.save();
            }
        }

        // Delete stock transactions
        await StockTransaction.deleteMany({
            referenceId: delivery._id,
            referenceModel: 'DeliveryIn'
        });

        // Update supplier financials
        const supplier = await Supplier.findById(delivery.supplierId);
        if (supplier) {
            supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - delivery.totalAmount);
            supplier.currentPayable = Math.max(0, (supplier.currentPayable || 0) - delivery.totalAmount);
            await supplier.save();
        }

        await DeliveryIn.deleteOne({ _id: req.params.id });

        res.json({ message: 'Delivery in reversed successfully' });
    } catch (error) {
        console.error('Delete delivery in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
