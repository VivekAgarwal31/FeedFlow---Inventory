import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Middleware to check if user is super admin
 */
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
    }
    next();
};

/**
 * Get all user subscriptions
 * GET /api/admin/subscriptions
 */
router.get('/subscriptions', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build search query
        let userQuery = {};
        if (search) {
            userQuery = {
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get users matching search
        const users = await User.find(userQuery)
            .select('_id email fullName role companyId')
            .populate('companyId', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const userIds = users.map(u => u._id);

        // Get subscriptions for these users
        const subscriptions = await UserSubscription.find({ userId: { $in: userIds } })
            .populate('planId')
            .lean();

        // Create a map of userId to subscription
        const subscriptionMap = new Map();
        subscriptions.forEach(sub => {
            subscriptionMap.set(sub.userId.toString(), sub);
        });

        // Combine user and subscription data
        const results = users.map(user => {
            const subscription = subscriptionMap.get(user._id.toString());

            let planInfo = {
                planName: 'No Plan',
                planType: 'none',
                status: 'inactive'
            };

            if (subscription && subscription.planId) {
                planInfo = {
                    planName: subscription.planId.name,
                    planType: subscription.planId.type,
                    status: subscription.status,
                    isTrial: subscription.trial?.isTrial || false,
                    trialEndsAt: subscription.trial?.endsAt,
                    updatedByAdmin: subscription.updatedByAdmin
                };

                // Calculate days remaining for trial
                if (subscription.trial?.isTrial && subscription.trial?.endsAt) {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0); // Start of today for accurate day counting
                    const daysRemaining = Math.ceil((subscription.trial.endsAt - now) / (1000 * 60 * 60 * 24));
                    planInfo.daysRemaining = Math.max(0, daysRemaining);
                }
            }

            return {
                userId: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                companyName: user.companyId?.name || 'No Company',
                ...planInfo,
                subscriptionId: subscription?._id
            };
        });

        // Get total count for pagination
        const totalUsers = await User.countDocuments(userQuery);

        res.json({
            subscriptions: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Failed to get subscriptions' });
    }
});

/**
 * Get subscription details for a specific user
 * GET /api/admin/subscriptions/:userId
 */
router.get('/subscriptions/:userId', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('email fullName role companyId')
            .populate('companyId', 'name')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const subscription = await UserSubscription.findOne({ userId })
            .populate('planId')
            .lean();

        if (!subscription) {
            return res.status(404).json({
                message: 'No subscription found for this user',
                user
            });
        }

        res.json({
            user,
            subscription
        });
    } catch (error) {
        console.error('Get user subscription error:', error);
        res.status(500).json({ message: 'Failed to get user subscription' });
    }
});

/**
 * Update user's plan (admin override)
 * PUT /api/admin/subscriptions/:userId/plan
 */
router.put('/subscriptions/:userId/plan', authenticate, requireSuperAdmin, [
    body('planType').isIn(['free', 'trial', 'paid']).withMessage('Invalid plan type'),
    body('notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.params;
        const { planType, notes } = req.body;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the plan
        const plan = await Plan.getByType(planType);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Find or create subscription
        let subscription = await UserSubscription.findOne({ userId });

        const now = new Date();
        let expiresAt = null;
        let trialInfo = {
            isTrial: false,
            startedAt: null,
            endsAt: null
        };

        // Set trial info if assigning trial plan
        if (planType === 'trial') {
            const trialEnd = new Date(now);
            // Add 13 days (not 14) because calculation counts from start of today
            // Today = Day 1, so 13 more days = Day 14
            trialEnd.setDate(trialEnd.getDate() + 13);
            // Set to end of day (23:59:59.999) for consistent day counting
            trialEnd.setHours(23, 59, 59, 999);

            trialInfo = {
                isTrial: true,
                startedAt: now,
                endsAt: trialEnd
            };
            expiresAt = trialEnd;
        }

        if (subscription) {
            // Update existing subscription
            subscription.planId = plan._id;
            subscription.status = 'active';
            subscription.trial = trialInfo;
            subscription.expiresAt = expiresAt;
            subscription.updatedByAdmin = true;
            subscription.adminNotes = notes || `Plan changed to ${plan.name} by admin`;
            await subscription.save();
        } else {
            // Create new subscription
            subscription = await UserSubscription.create({
                userId,
                planId: plan._id,
                status: 'active',
                trial: trialInfo,
                startedAt: now,
                expiresAt,
                updatedByAdmin: true,
                adminNotes: notes || `Plan assigned to ${plan.name} by admin`
            });
        }

        // Populate plan details
        await subscription.populate('planId');

        res.json({
            message: `User plan updated to ${plan.name} successfully`,
            subscription
        });
    } catch (error) {
        console.error('Update user plan error:', error);
        res.status(500).json({ message: 'Failed to update user plan' });
    }
});

/**
 * Get subscription statistics
 * GET /api/admin/subscriptions/stats
 */
router.get('/subscriptions-stats', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const totalSubscriptions = await UserSubscription.countDocuments({});

        // Get plan distribution
        const plans = await Plan.find({ isActive: true });
        const planStats = await Promise.all(
            plans.map(async (plan) => {
                const count = await UserSubscription.countDocuments({
                    planId: plan._id,
                    status: 'active'
                });
                return {
                    planName: plan.name,
                    planType: plan.type,
                    count
                };
            })
        );

        // Get trial statistics
        const activeTrials = await UserSubscription.countDocuments({
            'trial.isTrial': true,
            'trial.endsAt': { $gt: new Date() },
            status: 'active'
        });

        const expiredTrials = await UserSubscription.countDocuments({
            'trial.isTrial': true,
            'trial.endsAt': { $lte: new Date() }
        });

        // Get admin overrides
        const adminOverrides = await UserSubscription.countDocuments({
            updatedByAdmin: true
        });

        res.json({
            totalUsers,
            totalSubscriptions,
            usersWithoutSubscription: totalUsers - totalSubscriptions,
            planDistribution: planStats,
            trials: {
                active: activeTrials,
                expired: expiredTrials
            },
            adminOverrides
        });
    } catch (error) {
        console.error('Get subscription stats error:', error);
        res.status(500).json({ message: 'Failed to get subscription statistics' });
    }
});

export default router;
