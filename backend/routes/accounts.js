import express from 'express';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DirectSale from '../models/DirectSale.js';
import DirectPurchase from '../models/DirectPurchase.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get accounts receivable summary
router.get('/receivable', async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Get all unpaid and partial sales orders AND direct sales
        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find({
                companyId: userCompanyId,
                paymentStatus: { $in: ['pending', 'partial'] }
            }),
            DirectSale.find({
                companyId: userCompanyId,
                paymentType: 'credit', // Only include credit transactions
                paymentStatus: { $in: ['pending', 'partial'] }
            })
        ]);

        let totalOutstanding = 0;
        let overdueAmount = 0;
        const today = new Date();

        // Client breakdown map
        const clientBreakdownMap = new Map();

        // Aging analysis
        const aging = {
            current: 0,      // 0-30 days
            days31_60: 0,    // 31-60 days
            days61_90: 0,    // 61-90 days
            days90Plus: 0    // 90+ days
        };

        // Process sales orders
        salesOrders.forEach(order => {
            totalOutstanding += order.amountDue;

            if (order.isOverdue) {
                overdueAmount += order.amountDue;
            }

            // Aging analysis
            const daysOutstanding = Math.floor((today - new Date(order.orderDate)) / (1000 * 60 * 60 * 24));
            if (daysOutstanding <= 30) {
                aging.current += order.amountDue;
            } else if (daysOutstanding <= 60) {
                aging.days31_60 += order.amountDue;
            } else if (daysOutstanding <= 90) {
                aging.days61_90 += order.amountDue;
            } else {
                aging.days90Plus += order.amountDue;
            }

            // Client breakdown - add to existing or create new
            const clientId = order.clientId?._id.toString();
            const clientName = order.clientId?.clientName || order.clientId?.name || 'Unknown Client';

            if (clientId) {
                if (!clientBreakdownMap.has(clientId)) {
                    clientBreakdownMap.set(clientId, {
                        _id: clientId,
                        clientName: clientName,
                        totalDue: 0,
                        salesCount: 0,
                        overdueAmount: 0
                    });
                }
                const clientData = clientBreakdownMap.get(clientId);
                clientData.totalDue += order.amountDue;
                clientData.salesCount += 1;
                if (order.isOverdue) {
                    clientData.overdueAmount += order.amountDue;
                }
            }
        });

        // Process direct sales
        directSales.forEach(sale => {
            const amountDue = sale.totalAmount - (sale.amountPaid || 0);
            totalOutstanding += amountDue;

            // For direct sales, we don't have isOverdue, so we check the date
            const daysOutstanding = Math.floor((today - new Date(sale.saleDate || sale.createdAt)) / (1000 * 60 * 60 * 24));
            const isOverdue = daysOutstanding > 30; // Assuming 30 days payment term

            if (isOverdue) {
                overdueAmount += amountDue;
            }

            // Aging analysis
            if (daysOutstanding <= 30) {
                aging.current += amountDue;
            } else if (daysOutstanding <= 60) {
                aging.days31_60 += amountDue;
            } else if (daysOutstanding <= 90) {
                aging.days61_90 += amountDue;
            } else {
                aging.days90Plus += amountDue;
            }

            // Client breakdown - add to existing or create new
            const clientId = sale.clientId?._id.toString();
            const clientName = sale.clientId?.clientName || sale.clientId?.name || 'Unknown Client';

            if (clientId) {
                if (!clientBreakdownMap.has(clientId)) {
                    clientBreakdownMap.set(clientId, {
                        _id: clientId,
                        clientName: clientName,
                        totalDue: 0,
                        salesCount: 0,
                        overdueAmount: 0
                    });
                }
                const clientData = clientBreakdownMap.get(clientId);
                clientData.totalDue += amountDue;
                clientData.salesCount += 1; // Direct sales also count as a sale
                if (isOverdue) {
                    clientData.overdueAmount += amountDue;
                }
            }
        });

        // Get client-wise breakdown from both sources (this part is now redundant for topClients as clientBreakdownMap handles it)
        // However, the aggregation pipelines below are still useful for getting a comprehensive list if needed,
        // but for the topClients, we will use the clientBreakdownMap.
        const [orderBreakdown, directBreakdown] = await Promise.all([
            SalesOrder.aggregate([
                {
                    $match: {
                        companyId: userCompanyId,
                        paymentStatus: { $in: ['pending', 'partial'] }
                    }
                },
                {
                    $group: {
                        _id: '$clientId',
                        clientName: { $first: '$clientName' },
                        totalDue: { $sum: '$amountDue' },
                        salesCount: { $sum: 1 }
                    }
                }
            ]),
            DirectSale.aggregate([
                {
                    $match: {
                        companyId: userCompanyId,
                        paymentStatus: { $in: ['pending', 'partial'] }
                    }
                },
                {
                    $addFields: {
                        amountDue: { $subtract: ['$totalAmount', { $ifNull: ['$amountPaid', 0] }] }
                    }
                },
                {
                    $group: {
                        _id: '$clientId',
                        clientName: { $first: '$clientName' },
                        totalDue: { $sum: '$amountDue' },
                        salesCount: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Combine and aggregate by client
        const clientMap = new Map();
        [...orderBreakdown, ...directBreakdown].forEach(item => {
            const key = item._id?.toString();
            if (!key) return;

            if (clientMap.has(key)) {
                const existing = clientMap.get(key);
                existing.totalDue += item.totalDue;
                existing.salesCount += item.salesCount;
            } else {
                clientMap.set(key, { ...item });
            }
        });

        // Get all clients with opening balance
        const allClients = await Client.find({ companyId: userCompanyId }).lean();

        // Initialize client breakdown with opening balances and add to total outstanding/aging
        allClients.forEach(client => {
            if (client.openingBalance && client.openingBalance > 0) {
                const key = client._id.toString();
                if (clientMap.has(key)) {
                    const existing = clientMap.get(key);
                    existing.totalDue += client.openingBalance;
                    // For opening balance, we don't increment salesCount
                } else {
                    clientMap.set(key, {
                        _id: client._id,
                        clientName: client.clientName || client.name, // Use clientName if available, else name
                        totalDue: client.openingBalance,
                        salesCount: 0 // Opening balance is not a 'sale'
                    });
                }
                totalOutstanding += client.openingBalance;
                aging.current += client.openingBalance; // Opening balance is considered current unless specified otherwise
            }
        });

        const clientBreakdown = Array.from(clientMap.values())
            .sort((a, b) => b.totalDue - a.totalDue)
            .slice(0, 10);

        res.json({
            totalOutstanding,
            overdueAmount,
            currentAmount: totalOutstanding - overdueAmount,
            aging,
            topClients: clientBreakdown,
            salesCount: salesOrders.length + directSales.length
        });
    } catch (error) {
        console.error('Error fetching accounts receivable:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get client-wise receivables
router.get('/receivable/clients', async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Get all clients with outstanding amounts
        const clients = await Client.find({
            companyId: userCompanyId,
            currentCredit: { $gt: 0 }
        })
            .sort({ currentCredit: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Client.countDocuments({
            companyId: userCompanyId,
            currentCredit: { $gt: 0 }
        });

        // Enrich with sales data
        const enrichedClients = await Promise.all(clients.map(async (client) => {
            const salesOrders = await SalesOrder.find({
                companyId: userCompanyId,
                clientId: client._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const overdueCount = salesOrders.filter(s => s.isOverdue).length;

            return {
                ...client.toObject(),
                outstandingSales: salesOrders.length,
                overdueSales: overdueCount
            };
        }));

        res.json({
            clients: enrichedClients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching client receivables:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get outstanding invoices
router.get('/receivable/invoices', async (req, res) => {
    try {
        const { status, clientId, page = 1, limit = 50 } = req.query;
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        const query = {
            companyId: userCompanyId,
            paymentStatus: { $in: ['pending', 'partial'] }
        };

        if (status === 'overdue') {
            query.isOverdue = true;
        }

        if (clientId) {
            query.clientId = clientId;
        }

        const skip = (page - 1) * limit;

        // Get both sales orders and direct sales
        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find(query)
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            DirectSale.find(query)
                .sort({ saleDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
        ]);

        // Combine and sort by date
        const allInvoices = [
            ...salesOrders,
            ...directSales.map(ds => ({
                ...ds.toObject(),
                orderDate: ds.saleDate,
                isDirect: true
            }))
        ].sort((a, b) => new Date(b.orderDate || b.saleDate) - new Date(a.orderDate || a.saleDate))
            .slice(0, parseInt(limit));

        const [orderTotal, directTotal] = await Promise.all([
            SalesOrder.countDocuments(query),
            DirectSale.countDocuments(query)
        ]);

        const total = orderTotal + directTotal;

        res.json({
            invoices: allInvoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching outstanding invoices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get accounts payable summary
router.get('/payable', async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Get all unpaid and partial purchase orders AND direct purchases
        const [purchaseOrders, directPurchases] = await Promise.all([
            PurchaseOrder.find({
                companyId: userCompanyId,
                paymentStatus: { $in: ['pending', 'partial'] }
            }),
            DirectPurchase.find({
                companyId: userCompanyId,
                paymentStatus: { $in: ['pending', 'partial'] }
            })
        ]);

        let totalPayable = 0;
        let overdueAmount = 0;
        const today = new Date();

        // Aging analysis
        const aging = {
            current: 0,
            days31_60: 0,
            days61_90: 0,
            days90Plus: 0
        };

        // Process purchase orders
        purchaseOrders.forEach(order => {
            totalPayable += order.amountDue;

            if (order.isOverdue) {
                overdueAmount += order.amountDue;
            }

            // Calculate aging
            const orderDate = new Date(order.orderDate);
            const daysOld = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));

            if (daysOld <= 30) {
                aging.current += order.amountDue;
            } else if (daysOld <= 60) {
                aging.days31_60 += order.amountDue;
            } else if (daysOld <= 90) {
                aging.days61_90 += order.amountDue;
            } else {
                aging.days90Plus += order.amountDue;
            }
        });

        // Process direct purchases
        directPurchases.forEach(purchase => {
            const amountDue = purchase.totalAmount - (purchase.amountPaid || 0);
            totalPayable += amountDue;

            // Direct purchases don't have isOverdue, calculate based on date
            const purchaseDate = new Date(purchase.purchaseDate);
            const daysOld = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));

            if (daysOld > 30) {
                overdueAmount += amountDue;
            }

            // Calculate aging
            if (daysOld <= 30) {
                aging.current += amountDue;
            } else if (daysOld <= 60) {
                aging.days31_60 += amountDue;
            } else if (daysOld <= 90) {
                aging.days61_90 += amountDue;
            } else {
                aging.days90Plus += amountDue;
            }
        });

        // Get supplier-wise breakdown from both sources
        const [orderBreakdown, directBreakdown] = await Promise.all([
            PurchaseOrder.aggregate([
                {
                    $match: {
                        companyId: userCompanyId,
                        paymentStatus: { $in: ['pending', 'partial'] }
                    }
                },
                {
                    $group: {
                        _id: '$supplierId',
                        supplierName: { $first: '$supplierName' },
                        totalDue: { $sum: '$amountDue' },
                        purchasesCount: { $sum: 1 }
                    }
                }
            ]),
            DirectPurchase.aggregate([
                {
                    $match: {
                        companyId: userCompanyId,
                        paymentStatus: { $in: ['pending', 'partial'] }
                    }
                },
                {
                    $addFields: {
                        amountDue: { $subtract: ['$totalAmount', { $ifNull: ['$amountPaid', 0] }] }
                    }
                },
                {
                    $group: {
                        _id: '$supplierId',
                        supplierName: { $first: '$supplierName' },
                        totalDue: { $sum: '$amountDue' },
                        purchasesCount: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Combine and aggregate by supplier
        const supplierMap = new Map();
        [...orderBreakdown, ...directBreakdown].forEach(item => {
            const key = item._id?.toString();
            if (!key) return;

            if (supplierMap.has(key)) {
                const existing = supplierMap.get(key);
                existing.totalDue += item.totalDue;
                existing.purchasesCount += item.purchasesCount;
            } else {
                supplierMap.set(key, { ...item });
            }
        });

        const supplierBreakdown = Array.from(supplierMap.values())
            .sort((a, b) => b.totalDue - a.totalDue)
            .slice(0, 10);

        res.json({
            totalPayable,
            overdueAmount,
            currentAmount: totalPayable - overdueAmount,
            aging,
            topSuppliers: supplierBreakdown,
            purchasesCount: purchaseOrders.length + directPurchases.length
        });
    } catch (error) {
        console.error('Error fetching accounts payable:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get supplier-wise payables
router.get('/payable/suppliers', async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        // Get all suppliers with outstanding amounts
        const suppliers = await Supplier.find({
            companyId: userCompanyId,
            currentPayable: { $gt: 0 }
        })
            .sort({ currentPayable: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Supplier.countDocuments({
            companyId: userCompanyId,
            currentPayable: { $gt: 0 }
        });

        // Enrich with purchase data
        const enrichedSuppliers = await Promise.all(suppliers.map(async (supplier) => {
            const purchaseOrders = await PurchaseOrder.find({
                companyId: userCompanyId,
                supplierId: supplier._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const overdueCount = purchaseOrders.filter(p => p.isOverdue).length;

            return {
                ...supplier.toObject(),
                outstandingPurchases: purchaseOrders.length,
                overduePurchases: overdueCount
            };
        }));

        res.json({
            suppliers: enrichedSuppliers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching supplier payables:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get outstanding bills
router.get('/payable/bills', async (req, res) => {
    try {
        const { status, supplierId, page = 1, limit = 50 } = req.query;
        const userCompanyId = req.user.companyId?._id || req.user.companyId;

        const query = {
            companyId: userCompanyId,
            paymentStatus: { $in: ['pending', 'partial'] }
        };

        if (status === 'overdue') {
            query.isOverdue = true;
        }

        if (supplierId) {
            query.supplierId = supplierId;
        }

        const skip = (page - 1) * limit;

        // Get both purchase orders and direct purchases
        const [purchaseOrders, directPurchases] = await Promise.all([
            PurchaseOrder.find(query)
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            DirectPurchase.find(query)
                .sort({ purchaseDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
        ]);

        // Combine and sort by date
        const allBills = [
            ...purchaseOrders,
            ...directPurchases.map(dp => ({
                ...dp.toObject(),
                orderDate: dp.purchaseDate,
                isDirect: true
            }))
        ].sort((a, b) => new Date(b.orderDate || b.purchaseDate) - new Date(a.orderDate || a.purchaseDate))
            .slice(0, parseInt(limit));

        const [orderTotal, directTotal] = await Promise.all([
            PurchaseOrder.countDocuments(query),
            DirectPurchase.countDocuments(query)
        ]);

        const total = orderTotal + directTotal;

        res.json({
            bills: allBills,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching outstanding bills:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
