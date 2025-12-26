import express from 'express';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
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

        // Get all unpaid and partial sales
        const sales = await Sale.find({
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

        sales.forEach(sale => {
            totalOutstanding += sale.amountDue;

            if (sale.isOverdue) {
                overdueAmount += sale.amountDue;
            }

            // Calculate aging
            const saleDate = new Date(sale.saleDate);
            const daysOld = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));

            if (daysOld <= 30) {
                aging.current += sale.amountDue;
            } else if (daysOld <= 60) {
                aging.days31_60 += sale.amountDue;
            } else if (daysOld <= 90) {
                aging.days61_90 += sale.amountDue;
            } else {
                aging.days90Plus += sale.amountDue;
            }
        });

        // Get client-wise breakdown
        const clientBreakdown = await Sale.aggregate([
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
            salesCount: sales.length
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
            const sales = await Sale.find({
                companyId: userCompanyId,
                clientId: client._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const overdueCount = sales.filter(s => s.isOverdue).length;

            return {
                ...client.toObject(),
                outstandingSales: sales.length,
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

        const sales = await Sale.find(query)
            .sort({ saleDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Sale.countDocuments(query);

        res.json({
            invoices: sales,
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

        // Get all unpaid and partial purchases
        const purchases = await Purchase.find({
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

        purchases.forEach(purchase => {
            totalPayable += purchase.amountDue;

            if (purchase.isOverdue) {
                overdueAmount += purchase.amountDue;
            }

            // Calculate aging
            const purchaseDate = new Date(purchase.purchaseDate);
            const daysOld = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));

            if (daysOld <= 30) {
                aging.current += purchase.amountDue;
            } else if (daysOld <= 60) {
                aging.days31_60 += purchase.amountDue;
            } else if (daysOld <= 90) {
                aging.days61_90 += purchase.amountDue;
            } else {
                aging.days90Plus += purchase.amountDue;
            }
        });

        // Get supplier-wise breakdown
        const supplierBreakdown = await Purchase.aggregate([
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
            purchasesCount: purchases.length
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
            const purchases = await Purchase.find({
                companyId: userCompanyId,
                supplierId: supplier._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const overdueCount = purchases.filter(p => p.isOverdue).length;

            return {
                ...supplier.toObject(),
                outstandingPurchases: purchases.length,
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

        const purchases = await Purchase.find(query)
            .sort({ purchaseDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Purchase.countDocuments(query);

        res.json({
            bills: purchases,
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
