import express from 'express';
import { body, validationResult } from 'express-validator';
import DirectPurchase from '../models/DirectPurchase.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { createDirectPurchase, updateDirectPurchase, deleteDirectPurchase } from '../utils/directPurchaseService.js';

const router = express.Router();

// Get all direct purchases with pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query filters
        const query = { companyId, purchaseStatus: { $ne: 'cancelled' } };

        if (req.query.supplierId) {
            query.supplierId = req.query.supplierId;
        }

        if (req.query.startDate || req.query.endDate) {
            query.purchaseDate = {};
            if (req.query.startDate) {
                query.purchaseDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                query.purchaseDate.$lte = endDate;
            }
        }

        const [purchases, total] = await Promise.all([
            DirectPurchase.find(query)
                .populate('supplierId', 'name phone email')
                .sort({ purchaseDate: -1, purchaseNumber: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DirectPurchase.countDocuments(query)
        ]);

        res.json({
            purchases,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get direct purchases error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single direct purchase by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const purchase = await DirectPurchase.findOne({ _id: req.params.id, companyId })
            .populate('supplierId', 'name phone email address')
            .populate('performedBy', 'fullName email')
            .lean();

        if (!purchase) {
            return res.status(404).json({ message: 'Direct purchase not found' });
        }

        res.json({ purchase });
    } catch (error) {
        console.error('Get direct purchase error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new direct purchase
router.post(
    '/',
    authenticate,
    requirePermission('canManagePurchases'),
    [
        body('supplierId').notEmpty().withMessage('Supplier is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
        body('items.*.itemName').notEmpty().withMessage('Item name is required'),
        body('items.*.warehouseId').notEmpty().withMessage('Warehouse is required'),
        body('items.*.warehouseName').notEmpty().withMessage('Warehouse name is required'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
        body('items.*.costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required'),
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

            const purchaseData = {
                companyId,
                supplierId: req.body.supplierId,
                items: req.body.items,
                notes: req.body.notes,
                paymentType: req.body.paymentType,
                paymentMethod: req.body.paymentMethod,
                staffName: req.body.staffName || req.user.fullName
            };

            const result = await createDirectPurchase(purchaseData, userId);

            res.status(201).json(result);
        } catch (error) {
            console.error('Create direct purchase error:', error);
            res.status(500).json({ message: error.message || 'Server error' });
        }
    }
);

// Update direct purchase
router.put(
    '/:id',
    authenticate,
    requirePermission('canManagePurchases'),
    [
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.itemName').notEmpty().withMessage('Item name is required'),
        body('items.*.warehouseId').notEmpty().withMessage('Warehouse is required'),
        body('items.*.warehouseName').notEmpty().withMessage('Warehouse name is required'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
        body('items.*.costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const companyId = req.user.companyId?._id || req.user.companyId;
            const userId = req.user._id;
            const purchaseId = req.params.id;

            const updateData = {
                items: req.body.items,
                notes: req.body.notes
            };

            const result = await updateDirectPurchase(purchaseId, updateData, companyId, userId);

            res.json(result);
        } catch (error) {
            console.error('Update direct purchase error:', error);
            res.status(500).json({ message: error.message || 'Server error' });
        }
    }
);

// Delete (cancel) direct purchase
router.delete('/:id', authenticate, requirePermission('canManagePurchases'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const result = await deleteDirectPurchase(req.params.id, companyId);

        res.json(result);
    } catch (error) {
        console.error('Delete direct purchase error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

export default router;
