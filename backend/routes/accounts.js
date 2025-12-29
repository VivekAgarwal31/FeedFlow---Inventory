import express from 'express';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
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

        // Get all unpaid and partial sales orders
        const salesOrders = await SalesOrder.find({
            companyId: userCompanyId,
            paymentStatus: { $in: ['pending', 'partial'] }
        });

        let totalOutstanding = 0;
        let overdueAmount = 0;
        const today = new Date();

        // Aging analysis
        const aging = {
            current: 0,      // 0-30 days
            days31_60: 0,    // 31-60 days
            days61_90: 0,    // 61-90 days
            days90Plus: 0    // 90+ days
        };

        salesOrders.forEach(order => {
            totalOutstanding += order.amountDue;

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

        // Get client-wise breakdown
        const clientBreakdown = await SalesOrder.aggregate([
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
            },
            {
                $sort: { totalDue: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            totalOutstanding,
            overdueAmount,
            currentAmount: totalOutstanding - overdueAmount,
            aging,
            topClients: clientBreakdown,
            salesCount: salesOrders.length
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

        const salesOrders = await SalesOrder.find(query)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await SalesOrder.countDocuments(query);

        res.json({
            invoices: salesOrders,
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

        // Get all unpaid and partial purchase orders
        const purchaseOrders = await PurchaseOrder.find({
            companyId: userCompanyId,
            paymentStatus: { $in: ['pending', 'partial'] }
        });

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

        // Get supplier-wise breakdown
        const supplierBreakdown = await PurchaseOrder.aggregate([
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
            },
            {
                $sort: { totalDue: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            totalPayable,
            overdueAmount,
            currentAmount: totalPayable - overdueAmount,
            aging,
            topSuppliers: supplierBreakdown,
            purchasesCount: purchaseOrders.length
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

        const purchaseOrders = await PurchaseOrder.find(query)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PurchaseOrder.countDocuments(query);

        res.json({
            bills: purchaseOrders,
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
