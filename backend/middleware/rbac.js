import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Role hierarchy for permission checking
const roleHierarchy = {
    owner: 5,
    admin: 4,
    manager: 3,
    staff: 2,
    new_joinee: 1
};

// Require specific role(s) to access route
export const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userRole = req.user.role;
            const isAllowed = allowedRoles.includes(userRole);

            if (!isAllowed) {
                return res.status(403).json({
                    message: 'Insufficient permissions',
                    required: allowedRoles,
                    current: userRole
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

// Require specific permission to access route
export const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const hasPermission = req.user.permissions?.[permission];

            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Insufficient permissions',
                    required: permission
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

// Check if user has higher or equal role level
export const requireRoleLevel = (minimumRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userLevel = roleHierarchy[req.user.role] || 0;
            const requiredLevel = roleHierarchy[minimumRole] || 0;

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    message: 'Insufficient role level',
                    required: minimumRole,
                    current: req.user.role
                });
            }

            next();
        } catch (error) {
            console.error('Role level check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

// Get default permissions for a role
export const getRolePermissions = (role) => {
    const permissions = {
        owner: {
            canManageStaff: true,
            canManageInventory: true,
            canManageSales: true,
            canManagePurchases: true,
            canManageClients: true,
            canManageSuppliers: true,
            canViewReports: true,
            canManageSettings: true
        },
        admin: {
            canManageStaff: true,
            canManageInventory: true,
            canManageSales: true,
            canManagePurchases: true,
            canManageClients: true,
            canManageSuppliers: true,
            canViewReports: true,
            canManageSettings: false
        },
        manager: {
            canManageStaff: false,
            canManageInventory: true,
            canManageSales: true,
            canManagePurchases: true,
            canManageClients: true,
            canManageSuppliers: true,
            canViewReports: true,
            canManageSettings: false
        },
        staff: {
            canManageStaff: false,
            canManageInventory: true,
            canManageSales: true,
            canManagePurchases: true,
            canManageClients: false,
            canManageSuppliers: false,
            canViewReports: false,
            canManageSettings: false
        },
        new_joinee: {
            canManageStaff: false,
            canManageInventory: false,
            canManageSales: false,
            canManagePurchases: false,
            canManageClients: false,
            canManageSuppliers: false,
            canViewReports: false,
            canManageSettings: false
        }
    };

    return permissions[role] || permissions.new_joinee;
};
