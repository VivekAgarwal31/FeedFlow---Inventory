import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generic permission checker middleware
 * @param {string} permission - The permission to check (e.g., 'canManageSales')
 * @returns {Function} Express middleware function
 */
export const checkPermission = (permission) => {
    return (req, res, next) => {
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Owner and super_admin bypass all permission checks
        if (req.user.role === 'owner' || req.user.role === 'super_admin') {
            return next();
        }

        // Check if user has the required permission
        if (!req.user.permissions || !req.user.permissions[permission]) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                required: permission,
                hint: 'Contact your administrator to request access'
            });
        }

        next();
    };
};

/**
 * Specific permission checkers for common operations
 */
export const checkCanManageStaff = checkPermission('canManageStaff');
export const checkCanManageInventory = checkPermission('canManageInventory');
export const checkCanManageSales = checkPermission('canManageSales');
export const checkCanManagePurchases = checkPermission('canManagePurchases');
export const checkCanManageClients = checkPermission('canManageClients');
export const checkCanManageSuppliers = checkPermission('canManageSuppliers');
export const checkCanViewReports = checkPermission('canViewReports');
export const checkCanManageSettings = checkPermission('canManageSettings');

/**
 * Owner-only access middleware
 * For critical operations that only the company owner should perform
 */
export const ownerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin can also perform owner operations
    if (req.user.role === 'super_admin') {
        return next();
    }

    if (req.user.role !== 'owner') {
        return res.status(403).json({
            message: 'Owner access required',
            hint: 'This operation can only be performed by the company owner'
        });
    }

    next();
};

/**
 * Prevent users from modifying their own permissions or role
 * Used in staff management routes
 */
export const preventSelfModification = (req, res, next) => {
    const targetUserId = req.params.id || req.params.userId;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
        return res.status(403).json({
            message: 'Cannot modify your own permissions or role',
            hint: 'Ask another administrator to make these changes'
        });
    }

    next();
};

/**
 * Ensure user can only access data from their own company
 * Additional safety check beyond query filters
 */
export const enforceCompanyIsolation = (req, res, next) => {
    if (!req.user.companyId) {
        return res.status(403).json({
            message: 'Company association required',
            hint: 'Please join or create a company first'
        });
    }

    // Attach company ID to request for easy access
    req.companyId = req.user.companyId._id || req.user.companyId;
    next();
};
