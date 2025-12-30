import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';
import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';
import StockItem from '../models/StockItem.js';

/**
 * Get user's active subscription with plan details
 */
export const getUserSubscription = async (userId) => {
    try {
        const subscription = await UserSubscription.findOne({ userId })
            .populate('planId')
            .lean();

        if (!subscription) {
            return null;
        }

        return subscription;
    } catch (error) {
        console.error('Error getting user subscription:', error);
        return null;
    }
};

/**
 * Get user's plan features
 */
export const getUserPlanFeatures = async (userId) => {
    const subscription = await getUserSubscription(userId);

    if (!subscription || !subscription.planId) {
        // Default to free plan features if no subscription
        return {
            maxWarehouses: 2,
            maxItems: 5,
            backupAccess: false,
            reportsAccess: false,
            accountingAccess: false,
            advancedInventory: false
        };
    }

    return subscription.planId.features;
};

/**
 * Check if user is super admin (bypasses all restrictions)
 */
export const isSuperAdmin = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user && user.role === 'super_admin';
    } catch (error) {
        console.error('Error checking super admin:', error);
        return false;
    }
};

/**
 * Check if user can add a warehouse
 */
export const canAddWarehouse = async (userId, companyId) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(userId)) {
            return { allowed: true };
        }

        const features = await getUserPlanFeatures(userId);

        // Unlimited warehouses
        if (features.maxWarehouses === null) {
            return { allowed: true };
        }

        // Check current warehouse count
        const warehouseCount = await Warehouse.countDocuments({ companyId });

        if (warehouseCount >= features.maxWarehouses) {
            return {
                allowed: false,
                reason: `Your plan allows a maximum of ${features.maxWarehouses} warehouses. Upgrade to add more.`,
                limit: features.maxWarehouses,
                current: warehouseCount
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking warehouse limit:', error);
        return { allowed: false, reason: 'Error checking warehouse limit' };
    }
};

/**
 * Check if user can add a stock item
 */
export const canAddItem = async (userId, companyId) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(userId)) {
            return { allowed: true };
        }

        const features = await getUserPlanFeatures(userId);

        // Unlimited items
        if (features.maxItems === null) {
            return { allowed: true };
        }

        // Check current item count (unique items, not quantities)
        const itemCount = await StockItem.countDocuments({ companyId });

        if (itemCount >= features.maxItems) {
            return {
                allowed: false,
                reason: `Your plan allows a maximum of ${features.maxItems} items. Upgrade to add more.`,
                limit: features.maxItems,
                current: itemCount
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking item limit:', error);
        return { allowed: false, reason: 'Error checking item limit' };
    }
};

/**
 * Check if user can access backup functionality
 */
export const canAccessBackup = async (userId) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(userId)) {
            return { allowed: true };
        }

        const features = await getUserPlanFeatures(userId);

        if (!features.backupAccess) {
            return {
                allowed: false,
                reason: 'Backup functionality is not available on your current plan. Upgrade to access backups.'
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking backup access:', error);
        return { allowed: false, reason: 'Error checking backup access' };
    }
};

/**
 * Check if user can access reports
 */
export const canAccessReports = async (userId) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(userId)) {
            return { allowed: true };
        }

        const features = await getUserPlanFeatures(userId);

        if (!features.reportsAccess) {
            return {
                allowed: false,
                reason: 'Reports are not available on your current plan. Upgrade to access advanced reports.'
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking reports access:', error);
        return { allowed: false, reason: 'Error checking reports access' };
    }
};

/**
 * Check if user can access accounting module
 */
export const canAccessAccounting = async (userId) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(userId)) {
            return { allowed: true };
        }

        const features = await getUserPlanFeatures(userId);

        if (!features.accountingAccess) {
            return {
                allowed: false,
                reason: 'Accounting module is not available on your current plan. Upgrade to access accounting features.'
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking accounting access:', error);
        return { allowed: false, reason: 'Error checking accounting access' };
    }
};

/**
 * Check if user's trial has expired and handle downgrade
 */
export const checkAndHandleTrialExpiry = async (userId) => {
    try {
        const subscription = await UserSubscription.findOne({ userId });

        if (!subscription || !subscription.trial.isTrial) {
            return { expired: false };
        }

        if (subscription.isTrialExpired()) {
            // Get free plan
            const freePlan = await Plan.getByType('free');

            if (!freePlan) {
                console.error('Free plan not found');
                return { expired: true, downgraded: false };
            }

            // Downgrade to free plan
            subscription.planId = freePlan._id;
            subscription.status = 'active';
            subscription.trial.isTrial = false;
            subscription.expiresAt = null;
            await subscription.save();

            return { expired: true, downgraded: true };
        }

        return { expired: false };
    } catch (error) {
        console.error('Error checking trial expiry:', error);
        return { expired: false, error: error.message };
    }
};

/**
 * Get subscription status for display
 */
export const getSubscriptionStatus = async (userId) => {
    try {
        // Get fresh subscription data
        const subscription = await UserSubscription.findOne({ userId })
            .populate('planId')
            .lean();

        if (!subscription || !subscription.planId) {
            return {
                hasSubscription: false,
                planName: 'No Plan',
                planType: 'none'
            };
        }

        const status = {
            hasSubscription: true,
            planName: subscription.planId.name,
            planType: subscription.planId.type,
            status: subscription.status,
            features: subscription.planId.features
        };

        // Add trial info if applicable - check the trial object properly
        if (subscription.trial && subscription.trial.isTrial === true) {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today for accurate day counting
            const endsAt = new Date(subscription.trial.endsAt);
            const daysRemaining = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));

            status.isTrial = true;
            status.trialEndsAt = subscription.trial.endsAt;
            status.daysRemaining = Math.max(0, daysRemaining);
        } else {
            status.isTrial = false;
        }

        return status;
    } catch (error) {
        console.error('Error getting subscription status:', error);
        return {
            hasSubscription: false,
            planName: 'Error',
            planType: 'none',
            error: error.message
        };
    }
};
