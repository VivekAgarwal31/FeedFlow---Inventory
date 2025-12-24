// Admin authentication middleware
// Only allows super_admin users to access admin routes

export const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            message: 'Super admin access required. This action is restricted to system administrators.'
        });
    }

    next();
};
