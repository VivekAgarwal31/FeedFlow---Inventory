import express from 'express';
import { body, validationResult } from 'express-validator';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/adminAuth.js';
import { deleteCompanyData, getCompanyDataStats } from '../utils/cascadeDelete.js';
import { deleteOrphanedData, getOrphanedDataStats } from '../utils/orphanedDataCleanup.js';

const router = express.Router();

// All routes require authentication and super_admin role
router.use(authenticate, requireSuperAdmin);

// ============================================
// COMPANY MANAGEMENT ROUTES
// ============================================

// Get all companies with pagination and search
router.get('/companies', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { companyCode: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }

        const [companies, total] = await Promise.all([
            Company.find(query)
                .populate('ownerId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Company.countDocuments(query)
        ]);

        // Get user count for each company
        const companiesWithStats = await Promise.all(
            companies.map(async (company) => {
                const userCount = await User.countDocuments({ companyId: company._id });
                return {
                    ...company,
                    userCount
                };
            })
        );

        res.json({
            companies: companiesWithStats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single company with detailed stats
router.get('/companies/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('ownerId', 'fullName email phone')
            .lean();

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Get data statistics
        const dataStats = await getCompanyDataStats(company._id);

        // Get users
        const users = await User.find({ companyId: company._id })
            .select('fullName email role isActive lastLoginAt')
            .lean();

        res.json({
            company: {
                ...company,
                dataStats,
                users
            }
        });
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new company (admin-initiated)
router.post('/companies', [
    body('name').trim().isLength({ min: 2 }).withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('ownerName').trim().isLength({ min: 2 }).withMessage('Owner name is required'),
    body('ownerEmail').isEmail().withMessage('Valid owner email is required'),
    body('ownerPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, type, address, contactNumber, gstNumber, ownerName, ownerEmail, ownerPassword } = req.body;

        // Check if owner email already exists
        const existingUser = await User.findOne({ email: ownerEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Owner email already exists' });
        }

        // Create owner user first
        const owner = new User({
            fullName: ownerName,
            email: ownerEmail,
            password: ownerPassword,
            role: 'owner',
            isActive: true
        });
        await owner.save();

        // Create company
        const company = new Company({
            name,
            email,
            type: type || 'all',
            address,
            contactNumber,
            gstNumber,
            ownerId: owner._id,
            status: 'active'
        });
        await company.save();

        // Update owner with companyId
        owner.companyId = company._id;
        await owner.save();

        res.status(201).json({
            message: 'Company created successfully',
            company,
            owner: {
                _id: owner._id,
                fullName: owner.fullName,
                email: owner.email
            }
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update company
router.put('/companies/:id', [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, type, address, contactNumber, gstNumber } = req.body;

        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { name, email, type, address, contactNumber, gstNumber },
            { new: true, runValidators: true }
        );

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({
            message: 'Company updated successfully',
            company
        });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update company status (suspend/activate)
router.put('/companies/:id/status', [
    body('status').isIn(['active', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;

        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({
            message: `Company ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
            company
        });
    } catch (error) {
        console.error('Update company status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete company (CASCADE DELETE)
router.delete('/companies/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Perform cascade deletion
        const deletionStats = await deleteCompanyData(req.params.id);

        res.json({
            message: 'Company and all associated data deleted successfully',
            deletionStats
        });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            message: 'Failed to delete company',
            error: error.message
        });
    }
});

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// Get all users across all companies
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '', companyId = '', isActive = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }
        if (companyId) {
            query.companyId = companyId;
        }
        if (isActive !== '') {
            query.isActive = isActive === 'true';
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('companyId', 'name companyCode')
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(query)
        ]);

        // Import UserSubscription model
        const UserSubscription = (await import('../models/UserSubscription.js')).default;

        // Fetch subscriptions for all users
        const usersWithSubscriptions = await Promise.all(
            users.map(async (user) => {
                const subscription = await UserSubscription.findOne({ userId: user._id })
                    .populate('planId', 'name type')
                    .lean();
                return {
                    ...user,
                    subscription
                };
            })
        );

        res.json({
            users: usersWithSubscriptions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('companyId', 'name companyCode email')
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create user for any company
router.post('/users', [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('companyId').notEmpty().withMessage('Company is required'),
    body('role').isIn(['owner', 'admin', 'manager', 'staff', 'new_joinee']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, phone, companyId, role } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Verify company exists
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const user = new User({
            fullName,
            email,
            password,
            phone,
            companyId,
            role,
            isActive: true
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { fullName, email, phone, role, permissions } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = permissions;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status (suspend/activate)
router.put('/users/:id/status', [
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
            user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset user password
router.post('/users/:id/reset-password', [
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get system overview analytics
router.get('/analytics/overview', async (req, res) => {
    try {
        const [
            totalCompanies,
            activeCompanies,
            suspendedCompanies,
            totalUsers,
            activeUsers
        ] = await Promise.all([
            Company.countDocuments(),
            Company.countDocuments({ status: 'active' }),
            Company.countDocuments({ status: 'suspended' }),
            User.countDocuments(),
            User.countDocuments({ isActive: true })
        ]);

        // Get companies created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCompanies = await Company.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const newUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            overview: {
                companies: {
                    total: totalCompanies,
                    active: activeCompanies,
                    suspended: suspendedCompanies,
                    newThisMonth: newCompanies
                },
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                    newThisMonth: newUsers
                }
            }
        });
    } catch (error) {
        console.error('Get analytics overview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// DATA CLEANUP ROUTES
// ============================================

// Get orphaned data statistics
router.get('/cleanup/orphaned-stats', async (req, res) => {
    try {
        const stats = await getOrphanedDataStats();
        res.json(stats);
    } catch (error) {
        console.error('Get orphaned data stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete all orphaned data (data not belonging to any active company)
router.delete('/cleanup/orphaned-data', async (req, res) => {
    try {
        const result = await deleteOrphanedData();
        res.json({
            message: 'Orphaned data deleted successfully',
            ...result
        });
    } catch (error) {
        console.error('Delete orphaned data error:', error);
        res.status(500).json({
            message: 'Failed to delete orphaned data',
            error: error.message
        });
    }
});

// ============================================
// SYSTEM SETTINGS ROUTES
// ============================================

// Get system settings
router.get('/settings', async (req, res) => {
    try {
        const SystemSettings = (await import('../models/SystemSettings.js')).default;
        const settings = await SystemSettings.getSettings();
        res.json({ settings });
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update system settings
router.put('/settings', async (req, res) => {
    try {
        const SystemSettings = (await import('../models/SystemSettings.js')).default;
        const { googleLoginEnabled, googleOneTapEnabled } = req.body;

        const updates = {};
        if (typeof googleLoginEnabled !== 'undefined') {
            updates.googleLoginEnabled = googleLoginEnabled;
        }
        if (typeof googleOneTapEnabled !== 'undefined') {
            updates.googleOneTapEnabled = googleOneTapEnabled;
        }

        const settings = await SystemSettings.updateSettings(updates);

        res.json({
            message: 'System settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
