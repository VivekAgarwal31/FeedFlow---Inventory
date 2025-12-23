import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission, getRolePermissions } from '../middleware/rbac.js';

const router = express.Router();

// Get all staff in company
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const staff = await User.find({ companyId })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ staff });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user role
router.put('/:userId/role', authenticate, requirePermission('canManageStaff'), [
    body('role').isIn(['owner', 'admin', 'manager', 'staff', 'new_joinee']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.params;
        const { role } = req.body;
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the user to update
        const user = await User.findOne({ _id: userId, companyId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        // Only owner can assign owner role
        if (role === 'owner' && req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Only owners can assign owner role' });
        }

        // Update role and set default permissions
        user.role = role;
        user.setRolePermissions();
        await user.save();

        const updatedUser = await User.findById(userId).select('-password').lean();

        res.json({
            message: 'Role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user permissions
router.put('/:userId/permissions', authenticate, requirePermission('canManageStaff'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissions } = req.body;
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the user to update
        const user = await User.findOne({ _id: userId, companyId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own permissions
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own permissions' });
        }

        // Update permissions
        user.permissions = {
            ...user.permissions,
            ...permissions
        };
        await user.save();

        const updatedUser = await User.findById(userId).select('-password').lean();

        res.json({
            message: 'Permissions updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status (activate/deactivate)
router.put('/:userId/status', authenticate, requirePermission('canManageStaff'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the user to update
        const user = await User.findOne({ _id: userId, companyId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing own status
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own status' });
        }

        // Update status
        user.isActive = isActive;
        await user.save();

        const updatedUser = await User.findById(userId).select('-password').lean();

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove user from company
router.delete('/:userId', authenticate, requireRole(['owner']), async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Find the user to delete
        const user = await User.findOne({ _id: userId, companyId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting own account
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Prevent deleting other owners
        if (user.role === 'owner') {
            return res.status(400).json({ message: 'Cannot delete another owner' });
        }

        // Remove user from company (set companyId to null instead of deleting)
        user.companyId = null;
        user.role = 'new_joinee';
        user.isActive = false;
        user.setRolePermissions();
        await user.save();

        res.json({ message: 'User removed from company successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
