import express from 'express';
import { body, validationResult } from 'express-validator';
import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

// Middleware to ensure only super_admin can access
const superAdminOnly = requireRole(['super_admin']);

/**
 * Create a new coupon
 * POST /admin/coupons
 */
router.post('/', authenticate, superAdminOnly, [
    body('code').trim().isLength({ min: 4, max: 20 }).matches(/^[A-Z0-9]+$/i).withMessage('Code must be 4-20 alphanumeric characters'),
    body('type').isIn(['percentage', 'flat', 'free_plan']).withMessage('Invalid coupon type'),
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('applicablePlans').isArray({ min: 1 }).withMessage('At least one plan must be selected'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
    body('usageLimit.total').optional().isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
    body('usageLimit.perUser').optional().isBoolean(),
    body('description').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { code, type, value, applicablePlans, expiryDate, usageLimit, description } = req.body;

        // Validate value based on type
        if (type !== 'free_plan' && !value) {
            return res.status(400).json({ message: 'Value is required for percentage and flat coupons' });
        }

        if (type === 'percentage' && (value < 1 || value > 100)) {
            return res.status(400).json({ message: 'Percentage value must be between 1 and 100' });
        }

        // Check if code already exists (case-insensitive)
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        // Validate expiry date is in future
        if (expiryDate && new Date(expiryDate) <= new Date()) {
            return res.status(400).json({ message: 'Expiry date must be in the future' });
        }

        // Create coupon
        const coupon = new Coupon({
            code: code.toUpperCase(),
            type,
            value: type === 'free_plan' ? 0 : value,
            applicablePlans,
            expiryDate: expiryDate || null,
            usageLimit: {
                total: usageLimit?.total || null,
                perUser: usageLimit?.perUser || false
            },
            description: description || '',
            createdBy: req.user._id
        });

        await coupon.save();

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ message: 'Failed to create coupon' });
    }
});

/**
 * Get all coupons
 * GET /admin/coupons
 */
router.get('/', authenticate, superAdminOnly, async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ coupons });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ message: 'Failed to fetch coupons' });
    }
});

/**
 * Get coupon by ID
 * GET /admin/coupons/:id
 */
router.get('/:id', authenticate, superAdminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('createdBy', 'fullName email')
            .lean();

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ coupon });
    } catch (error) {
        console.error('Get coupon error:', error);
        res.status(500).json({ message: 'Failed to fetch coupon' });
    }
});

/**
 * Update coupon
 * PUT /admin/coupons/:id
 */
router.put('/:id', authenticate, superAdminOnly, [
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
    body('usageLimit.total').optional().isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
    body('usageLimit.perUser').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('description').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const { value, expiryDate, usageLimit, isActive, description } = req.body;

        // Update allowed fields only (cannot change code or type)
        if (value !== undefined) {
            if (coupon.type === 'percentage' && (value < 1 || value > 100)) {
                return res.status(400).json({ message: 'Percentage value must be between 1 and 100' });
            }
            coupon.value = value;
        }

        if (expiryDate !== undefined) {
            if (expiryDate && new Date(expiryDate) <= new Date()) {
                return res.status(400).json({ message: 'Expiry date must be in the future' });
            }
            coupon.expiryDate = expiryDate || null;
        }

        if (usageLimit !== undefined) {
            if (usageLimit.total !== undefined) coupon.usageLimit.total = usageLimit.total;
            if (usageLimit.perUser !== undefined) coupon.usageLimit.perUser = usageLimit.perUser;
        }

        if (isActive !== undefined) coupon.isActive = isActive;
        if (description !== undefined) coupon.description = description;

        await coupon.save();

        res.json({
            message: 'Coupon updated successfully',
            coupon
        });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ message: 'Failed to update coupon' });
    }
});

/**
 * Toggle coupon active status
 * PATCH /admin/coupons/:id/toggle
 */
router.patch('/:id/toggle', authenticate, superAdminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
            coupon
        });
    } catch (error) {
        console.error('Toggle coupon error:', error);
        res.status(500).json({ message: 'Failed to toggle coupon status' });
    }
});

/**
 * Get coupon usage history
 * GET /admin/coupons/:id/usage
 */
router.get('/:id/usage', authenticate, superAdminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const usageHistory = await CouponUsage.find({ couponId: req.params.id })
            .populate('userId', 'fullName email')
            .populate('companyId', 'name')
            .sort({ appliedAt: -1 })
            .lean();

        res.json({
            coupon: {
                code: coupon.code,
                usedCount: coupon.usedCount,
                usageLimit: coupon.usageLimit
            },
            usageHistory
        });
    } catch (error) {
        console.error('Get coupon usage error:', error);
        res.status(500).json({ message: 'Failed to fetch usage history' });
    }
});

/**
 * Delete coupon
 * DELETE /admin/coupons/:id
 */
router.delete('/:id', authenticate, superAdminOnly, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check if coupon has been used
        if (coupon.usedCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete coupon that has been used. Deactivate it instead.'
            });
        }

        await Coupon.findByIdAndDelete(req.params.id);

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ message: 'Failed to delete coupon' });
    }
});

export default router;
