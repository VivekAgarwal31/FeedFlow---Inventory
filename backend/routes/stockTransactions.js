import express from 'express';
import StockTransaction from '../models/StockTransaction.js';
import { authenticate } from '../middleware/auth.js';

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
                .sort({ transactionDate: -1 })
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

export default router;
