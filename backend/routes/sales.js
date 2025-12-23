import express from 'express';
import { body, validationResult } from 'express-validator';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import Warehouse from '../models/Warehouse.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all sales with pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
            Sale.find({ companyId })
                .sort({ saleDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Sale.countDocuments({ companyId })
        ]);

        res.json({
            sales,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalCount: total
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get revenue statistics
router.get('/revenue', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate } = req.query;
        const query = { companyId };

        if (startDate || endDate) {
            query.saleDate = {};
            if (startDate) query.saleDate.$gte = new Date(startDate);
            if (endDate) query.saleDate.$lte = new Date(endDate);
        }

        const result = await Sale.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalSales: { $sum: 1 },
                    averageSale: { $avg: '$totalAmount' }
                }
            }
        ]);

        const stats = result[0] || { totalRevenue: 0, totalSales: 0, averageSale: 0 };

        res.json({ revenue: stats });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create sale
router.post('/', authenticate, [
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

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { clientName, clientPhone, clientEmail, items, totalAmount, paymentStatus, paymentMethod, notes, saleDate } = req.body;

        // Create or update client
        let client = await Client.findOne({ companyId, name: clientName });

        if (!client) {
            client = new Client({
                companyId,
                name: clientName,
                phone: clientPhone,
                email: clientEmail,
                totalPurchases: totalAmount,  // Total amount spent
                totalRevenue: totalAmount,
                salesCount: 1,  // Number of sales
                lastPurchaseDate: saleDate || new Date()
            });
            await client.save();
        } else {
            client.totalPurchases += totalAmount;  // Add amount
            client.totalRevenue += totalAmount;
            client.salesCount += 1;  // Increment sale count
            client.lastPurchaseDate = saleDate || new Date();
            if (clientPhone && !client.phone) client.phone = clientPhone;
            if (clientEmail && !client.email) client.email = clientEmail;
            await client.save();
        }

        // Create sale
        const sale = new Sale({
            companyId,
            clientId: client._id,
            clientName,
            clientPhone,
            clientEmail,
            items,
            totalAmount,
            paymentStatus: paymentStatus || 'pending',
            paymentMethod: paymentMethod || 'cash',
            notes,
            saleDate: saleDate || new Date()
        });

        await sale.save();

        // Update stock quantities and create transactions
        let totalQuantity = 0;
        const itemsForTransaction = [];
        const warehouseSet = new Set();

        for (const item of items) {
            // Find stock item and verify it exists
            const stockItem = await StockItem.findOne({
                _id: item.itemId,
                companyId
            });

            if (!stockItem) {
                return res.status(404).json({
                    message: `Stock item "${item.itemName}" not found`
                });
            }

            // Check if sufficient stock is available
            if (stockItem.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for "${item.itemName}". Available: ${stockItem.quantity}, Required: ${item.quantity}`
                });
            }

            // Deduct stock
            stockItem.quantity -= item.quantity;
            await stockItem.save();

            // Track for consolidated transaction
            totalQuantity += item.quantity;
            itemsForTransaction.push({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName
            });

            // Track unique warehouses
            if (item.warehouseId) {
                warehouseSet.add(item.warehouseId.toString());
            }
        }

        // Create single or consolidated transaction
        if (items.length === 1) {
            // Single item - create traditional transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'sale',
                itemId: items[0].itemId,
                itemName: itemsForTransaction[0].itemName,
                warehouseId: items[0].warehouseId,
                warehouseName: items[0].warehouseName,
                quantity: -items[0].quantity,
                referenceId: sale._id,
                referenceModel: 'Sale',
                reason: `Sale to ${clientName}`,
                transactionDate: saleDate || new Date(),
                performedBy: req.user._id
            });
            await transaction.save();
        } else {
            // Multiple items - create consolidated transaction
            const transaction = new StockTransaction({
                companyId,
                type: 'sale',
                itemId: items[0].itemId,
                itemName: `${items.length} items`,
                warehouseId: items[0].warehouseId,
                warehouseName: warehouseSet.size > 1
                    ? `${warehouseSet.size} warehouses`
                    : items[0].warehouseName,
                quantity: -totalQuantity,
                items: itemsForTransaction,
                referenceId: sale._id,
                referenceModel: 'Sale',
                reason: `Sale to ${clientName}`,
                transactionDate: saleDate || new Date(),
                performedBy: req.user._id
            });
            await transaction.save();
        }

        res.status(201).json({
            message: 'Sale created successfully',
            sale
        });
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete sale
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const sale = await Sale.findOneAndDelete({
            _id: req.params.id,
            companyId
        });

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Update client statistics
        if (sale.clientId) {
            const client = await Client.findById(sale.clientId);
            if (client) {
                client.totalPurchases = Math.max(0, client.totalPurchases - sale.totalAmount);
                client.totalRevenue = Math.max(0, client.totalRevenue - sale.totalAmount);
                client.salesCount = Math.max(0, client.salesCount - 1);  // Decrement sale count
                await client.save();
            }
        }

        // Restore stock quantities and delete associated transactions
        for (const item of sale.items) {
            const stockItem = await StockItem.findById(item.itemId);
            if (stockItem) {
                // Restore stock quantity
                stockItem.quantity += item.quantity;
                await stockItem.save();
            }
        }

        // Delete associated stock transactions
        await StockTransaction.deleteMany({
            referenceId: sale._id,
            referenceModel: 'Sale'
        });

        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
