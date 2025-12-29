import {
    canAddWarehouse,
    canAddItem,
    canAccessBackup,
    canAccessReports,
    canAccessAccounting,
    isSuperAdmin
} from '../utils/subscriptionHelpers.js';

/**
 * Middleware to check if user can add a warehouse
 */
export const checkWarehouseLimit = async (req, res, next) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(req.user._id)) {
            return next();
        }

        const companyId = req.user.companyId;
        const result = await canAddWarehouse(req.user._id, companyId);

        if (!result.allowed) {
            return res.status(403).json({
                message: result.reason,
                limit: result.limit,
                current: result.current,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Warehouse limit check error:', error);
        res.status(500).json({ message: 'Failed to check warehouse limit' });
    }
};

/**
 * Middleware to check if user can add a stock item
 */
export const checkItemLimit = async (req, res, next) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(req.user._id)) {
            return next();
        }

        const companyId = req.user.companyId;
        const result = await canAddItem(req.user._id, companyId);

        if (!result.allowed) {
            return res.status(403).json({
                message: result.reason,
                limit: result.limit,
                current: result.current,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Item limit check error:', error);
        res.status(500).json({ message: 'Failed to check item limit' });
    }
};

/**
 * Middleware to check if user can access backup
 */
export const checkBackupAccess = async (req, res, next) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(req.user._id)) {
            return next();
        }

        const result = await canAccessBackup(req.user._id);

        if (!result.allowed) {
            return res.status(403).json({
                message: result.reason,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Backup access check error:', error);
        res.status(500).json({ message: 'Failed to check backup access' });
    }
};

/**
 * Middleware to check if user can access reports
 */
export const checkReportsAccess = async (req, res, next) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(req.user._id)) {
            return next();
        }

        const result = await canAccessReports(req.user._id);

        if (!result.allowed) {
            return res.status(403).json({
                message: result.reason,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Reports access check error:', error);
        res.status(500).json({ message: 'Failed to check reports access' });
    }
};

/**
 * Middleware to check if user can access accounting
 */
export const checkAccountingAccess = async (req, res, next) => {
    try {
        // Super admin bypass
        if (await isSuperAdmin(req.user._id)) {
            return next();
        }

        const result = await canAccessAccounting(req.user._id);

        if (!result.allowed) {
            return res.status(403).json({
                message: result.reason,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        console.error('Accounting access check error:', error);
        res.status(500).json({ message: 'Failed to check accounting access' });
    }
};
