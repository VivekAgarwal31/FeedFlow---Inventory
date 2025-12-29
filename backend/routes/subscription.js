import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';
import {
    getUserSubscription,
    getSubscriptionStatus,
    canAddWarehouse,
    canAddItem,
    canAccessBackup,
    canAccessReports,
    canAccessAccounting
} from '../utils/subscriptionHelpers.js';

const router = express.Router();

// Get current user's subscription
router.get('/current', authenticate, async (req, res) => {
    try {
        const subscription = await getUserSubscription(req.user._id);

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        const status = await getSubscriptionStatus(req.user._id);

        res.json({
            subscription,
            status
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Failed to get subscription' });
    }
});

// Get subscription status (lightweight)
router.get('/status', authenticate, async (req, res) => {
    try {
        const status = await getSubscriptionStatus(req.user._id);
        res.json(status);
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ message: 'Failed to get subscription status' });
    }
});

// Get all available plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        res.json({ plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Failed to get plans' });
    }
});

// Check feature access
router.post('/check-access', authenticate, async (req, res) => {
    try {
        const { feature, companyId } = req.body;

        let result;

        switch (feature) {
            case 'warehouse':
                result = await canAddWarehouse(req.user._id, companyId);
                break;
            case 'item':
                result = await canAddItem(req.user._id, companyId);
                break;
            case 'backup':
                result = await canAccessBackup(req.user._id);
                break;
            case 'reports':
                result = await canAccessReports(req.user._id);
                break;
            case 'accounting':
                result = await canAccessAccounting(req.user._id);
                break;
            default:
                return res.status(400).json({ message: 'Invalid feature type' });
        }

        res.json(result);
    } catch (error) {
        console.error('Check access error:', error);
        res.status(500).json({ message: 'Failed to check access' });
    }
});

export default router;
