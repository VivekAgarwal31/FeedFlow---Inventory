import express from 'express';
import StockTransaction from '../models/StockTransaction.js';
import StockItem from '../models/StockItem.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import DirectSale from '../models/DirectSale.js';
import DirectPurchase from '../models/DirectPurchase.js';
import JournalEntry from '../models/JournalEntry.js';
import JournalLine from '../models/JournalLine.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all transactions with filtering and pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        // Build query
        const query = { companyId };

        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.itemId) {
            query.itemId = req.query.itemId;
        }

        if (req.query.warehouseId) {
            query.warehouseId = req.query.warehouseId;
        }

        if (req.query.startDate || req.query.endDate) {
            query.transactionDate = {};
            if (req.query.startDate) query.transactionDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.transactionDate.$lte = new Date(req.query.endDate);
        }

        const [transactions, total] = await Promise.all([
            StockTransaction.find(query)
                .sort({ transactionDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StockTransaction.countDocuments(query)
        ]);

        res.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get transaction by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const transaction = await StockTransaction.findOne({
            _id: req.params.id,
            companyId
        })
            .populate('itemId')
            .populate('warehouseId')
            .populate('toWarehouseId')
            .lean();

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ transaction });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete stock transaction
router.delete('/:id', authenticate, requirePermission('canManageInventory'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the transaction first to get its details
        const transaction = await StockTransaction.findOne({
            _id: req.params.id,
            companyId
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check if this transaction is linked to a sale or purchase
        // If so, delete the parent record which will cascade delete all related transactions
        if (transaction.referenceId && transaction.referenceModel) {
            if (transaction.referenceModel === 'Sale') {
                // Delete the sale (which will cascade delete all its transactions)
                const sale = await Sale.findById(transaction.referenceId);
                if (sale) {
                    // Update client statistics
                    if (sale.clientId) {
                        const client = await Client.findById(sale.clientId);
                        if (client) {
                            client.totalPurchases = Math.max(0, client.totalPurchases - sale.totalAmount);
                            client.totalRevenue = Math.max(0, client.totalRevenue - sale.totalAmount);
                            client.salesCount = Math.max(0, client.salesCount - 1);
                            await client.save();
                        }
                    }

                    // Restore stock quantities for all items
                    for (const item of sale.items) {
                        const stockItem = await StockItem.findById(item.itemId);
                        if (stockItem) {
                            stockItem.quantity += item.quantity;
                            await stockItem.save();
                        }
                    }

                    // Delete all associated stock transactions
                    await StockTransaction.deleteMany({
                        referenceId: sale._id,
                        referenceModel: 'Sale'
                    });

                    // Delete the sale
                    await Sale.findByIdAndDelete(sale._id);
                }
            } else if (transaction.referenceModel === 'Purchase') {
                // Delete the purchase (which will cascade delete all its transactions)
                const purchase = await Purchase.findById(transaction.referenceId);
                if (purchase) {
                    // Restore stock quantities for all items
                    for (const item of purchase.items) {
                        const stockItem = await StockItem.findById(item.itemId);
                        if (stockItem) {
                            stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                            await stockItem.save();
                        }
                    }

                    // Delete all associated stock transactions
                    await StockTransaction.deleteMany({
                        referenceId: purchase._id,
                        referenceModel: 'Purchase'
                    });

                    // Delete the purchase
                    await Purchase.findByIdAndDelete(purchase._id);
                }
            } else if (transaction.referenceModel === 'DirectSale') {
                // Delete the direct sale and clean up all associated records
                const directSale = await DirectSale.findById(transaction.referenceId);
                if (directSale) {
                    // Update client receivables
                    if (directSale.clientId && directSale.paymentType === 'credit') {
                        const client = await Client.findById(directSale.clientId);
                        if (client) {
                            const amountDue = directSale.totalAmount - (directSale.amountPaid || 0);
                            client.currentCredit = Math.max(0, client.currentCredit - amountDue);
                            client.totalReceivable = Math.max(0, client.totalReceivable - amountDue);
                            await client.save();
                        }
                    }

                    // Delete associated journal entries
                    const journalEntries = await JournalEntry.find({
                        referenceType: 'DirectSale',
                        referenceId: directSale._id
                    });
                    for (const entry of journalEntries) {
                        await JournalLine.deleteMany({ journalEntryId: entry._id });
                        await JournalEntry.findByIdAndDelete(entry._id);
                    }

                    // Restore stock quantities for all items
                    for (const item of directSale.items) {
                        const stockItem = await StockItem.findOne({
                            companyId,
                            warehouseId: item.warehouseId,
                            itemName: item.itemName,
                            bagSize: item.bagSize,
                            category: item.category
                        });
                        if (stockItem) {
                            stockItem.quantity += item.quantity;
                            await stockItem.save();
                        }
                    }

                    // Delete all associated stock transactions
                    await StockTransaction.deleteMany({
                        referenceId: directSale._id,
                        referenceModel: 'DirectSale'
                    });

                    // Delete the direct sale
                    await DirectSale.findByIdAndDelete(directSale._id);
                }
            } else if (transaction.referenceModel === 'DirectPurchase') {
                // Delete the direct purchase and clean up all associated records
                const directPurchase = await DirectPurchase.findById(transaction.referenceId);
                if (directPurchase) {
                    // Update supplier payables
                    if (directPurchase.supplierId && directPurchase.paymentType === 'credit') {
                        const supplier = await Supplier.findById(directPurchase.supplierId);
                        if (supplier) {
                            const amountDue = directPurchase.totalAmount - (directPurchase.amountPaid || 0);
                            supplier.currentPayable = Math.max(0, supplier.currentPayable - amountDue);
                            supplier.totalPayable = Math.max(0, supplier.totalPayable - amountDue);
                            await supplier.save();
                        }
                    }

                    // Delete associated journal entries
                    const journalEntries = await JournalEntry.find({
                        referenceType: 'DirectPurchase',
                        referenceId: directPurchase._id
                    });
                    for (const entry of journalEntries) {
                        await JournalLine.deleteMany({ journalEntryId: entry._id });
                        await JournalEntry.findByIdAndDelete(entry._id);
                    }

                    // Restore stock quantities for all items (remove them since they were added)
                    for (const item of directPurchase.items) {
                        const stockItem = await StockItem.findOne({
                            companyId,
                            warehouseId: item.warehouseId,
                            itemName: item.itemName,
                            bagSize: item.bagSize,
                            category: item.category
                        });
                        if (stockItem) {
                            stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                            await stockItem.save();
                        }
                    }

                    // Delete all associated stock transactions
                    await StockTransaction.deleteMany({
                        referenceId: directPurchase._id,
                        referenceModel: 'DirectPurchase'
                    });

                    // Delete the direct purchase
                    await DirectPurchase.findByIdAndDelete(directPurchase._id);
                }
            }

            return res.json({ message: `Transaction and associated ${transaction.referenceModel.toLowerCase()} deleted successfully` });
        }

        // Reverse the stock changes based on transaction type
        if (transaction.items && transaction.items.length > 0) {
            // Multi-item transaction
            for (const item of transaction.items) {
                const stockItem = await StockItem.findById(item.itemId);
                if (stockItem) {
                    switch (transaction.type) {
                        case 'stock_in':
                            // Reverse stock in: subtract the quantity
                            stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                            break;
                        case 'stock_out':
                            // Reverse stock out: add back the quantity
                            stockItem.quantity += item.quantity;
                            break;
                        case 'stock_adjust':
                            // Reverse adjustment based on adjustment type
                            if (item.adjustmentType === 'increase') {
                                stockItem.quantity = Math.max(0, stockItem.quantity - item.quantity);
                            } else {
                                stockItem.quantity += item.quantity;
                            }
                            break;
                    }
                    await stockItem.save();
                }
            }
        } else {
            // Single item transaction
            const stockItem = await StockItem.findById(transaction.itemId);
            if (stockItem) {
                switch (transaction.type) {
                    case 'stock_in':
                        // Reverse stock in: subtract the quantity
                        stockItem.quantity = Math.max(0, stockItem.quantity - transaction.quantity);
                        break;
                    case 'stock_out':
                        // Reverse stock out: add back the quantity (quantity is negative)
                        stockItem.quantity += Math.abs(transaction.quantity);
                        break;
                    case 'stock_move':
                        // Reverse stock move: move back from destination to source
                        // Find stock in destination warehouse
                        const destStock = await StockItem.findOne({
                            companyId,
                            warehouseId: transaction.toWarehouseId,
                            itemName: stockItem.itemName,
                            bagSize: stockItem.bagSize,
                            category: stockItem.category
                        });
                        if (destStock) {
                            destStock.quantity = Math.max(0, destStock.quantity - transaction.quantity);
                            await destStock.save();
                        }
                        // Add back to source warehouse
                        stockItem.quantity += transaction.quantity;
                        break;
                    case 'stock_adjust':
                        // Reverse adjustment (quantity can be positive or negative)
                        stockItem.quantity -= transaction.quantity;
                        stockItem.quantity = Math.max(0, stockItem.quantity);
                        break;
                }
                await stockItem.save();
            }
        }

        // Delete the transaction
        await StockTransaction.findByIdAndDelete(req.params.id);

        res.json({ message: 'Transaction deleted and stock reversed successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
