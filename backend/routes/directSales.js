import express from 'express';
import { body, validationResult } from 'express-validator';
import DirectSale from '../models/DirectSale.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { createDirectSale, updateDirectSale, deleteDirectSale } from '../utils/directSaleService.js';

const router = express.Router();

// Get all direct sales with pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query filters
        const query = { companyId, saleStatus: { $ne: 'cancelled' } };

        if (req.query.clientId) {
            query.clientId = req.query.clientId;
        }

        if (req.query.startDate || req.query.endDate) {
            query.saleDate = {};
            if (req.query.startDate) {
                query.saleDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.saleDate.$lte = endDate;
            }
        }

        const [sales, total] = await Promise.all([
            DirectSale.find(query)
                .populate('clientId', 'name phone email')
                .sort({ saleDate: -1, saleNumber: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DirectSale.countDocuments(query)
        ]);

        res.json({
            sales,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get direct sales error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single direct sale by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const sale = await DirectSale.findOne({ _id: req.params.id, companyId })
            .populate('clientId', 'name phone email address')
            .populate('performedBy', 'fullName email')
            .lean();

        if (!sale) {
            return res.status(404).json({ message: 'Direct sale not found' });
        }

        res.json({ sale });
    } catch (error) {
        console.error('Get direct sale error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new direct sale
router.post(
    '/',
    authenticate,
    requirePermission('canManageSales'),
    [
        body('clientId').notEmpty().withMessage('Client is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
        body('items.*.itemName').notEmpty().withMessage('Item name is required'),
        body('items.*.warehouseId').notEmpty().withMessage('Warehouse is required'),
        body('items.*.warehouseName').notEmpty().withMessage('Warehouse name is required'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
        body('items.*.sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price is required'),
        body('staffName').notEmpty().withMessage('Staff name is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const companyId = req.user.companyId?._id || req.user.companyId;
            const userId = req.user._id;

            const saleData = {
                companyId,
                clientId: req.body.clientId,
                items: req.body.items,
                notes: req.body.notes,
                paymentType: req.body.paymentType,
                paymentMethod: req.body.paymentMethod,
                staffName: req.body.staffName || req.user.fullName
            };

            const result = await createDirectSale(saleData, userId);

            res.status(201).json(result);
        } catch (error) {
            console.error('Create direct sale error:', error);
            res.status(500).json({ message: error.message || 'Server error' });
        }
    }
);

// Update direct sale
router.put(
    '/:id',
    authenticate,
    requirePermission('canManageSales'),
    [
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.itemName').notEmpty().withMessage('Item name is required'),
        body('items.*.warehouseId').notEmpty().withMessage('Warehouse is required'),
        body('items.*.warehouseName').notEmpty().withMessage('Warehouse name is required'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
        body('items.*.sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const companyId = req.user.companyId?._id || req.user.companyId;
            const userId = req.user._id;
            const saleId = req.params.id;

            const updateData = {
                items: req.body.items,
                notes: req.body.notes
            };

            const result = await updateDirectSale(saleId, updateData, companyId, userId);

            res.json(result);
        } catch (error) {
            console.error('Update direct sale error:', error);
            res.status(500).json({ message: error.message || 'Server error' });
        }
    }
);

// Delete (cancel) direct sale
router.delete('/:id', authenticate, requirePermission('canManageSales'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const result = await deleteDirectSale(req.params.id, companyId);

        res.json(result);
    } catch (error) {
        console.error('Delete direct sale error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

export default router;
