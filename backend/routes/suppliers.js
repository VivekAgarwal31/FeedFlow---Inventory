import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryIn from '../models/DeliveryIn.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get supplier list for dropdowns
router.get('/list', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const suppliers = await Supplier.find({ companyId, isActive: true })
            .select('_id name')
            .sort({ name: 1 })
            .lean();

        res.json({ suppliers });
    } catch (error) {
        console.error('Get supplier list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const suppliers = await Supplier.find({ companyId })
            .sort({ name: 1 })
            .lean();

        // Calculate purchase statistics for each supplier
        const suppliersWithStats = await Promise.all(suppliers.map(async (supplier) => {
            const purchaseOrders = await PurchaseOrder.find({
                companyId,
                supplierName: supplier.name
            }).lean();

            const totalPurchases = purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const purchaseCount = purchaseOrders.length;

            const lastPurchaseDate = purchaseOrders.length > 0
                ? purchaseOrders.reduce((latest, order) => {
                    const orderDate = new Date(order.orderDate || order.createdAt);
                    return orderDate > latest ? orderDate : latest;
                }, new Date(0))
                : null;

            // Calculate current payable from unpaid/partial orders
            const unpaidOrders = purchaseOrders.filter(order =>
                order.paymentStatus === 'pending' || order.paymentStatus === 'partial'
            );
            const currentPayable = unpaidOrders.reduce((sum, order) => {
                const amountDue = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
                return sum + amountDue;
            }, 0);

            return {
                ...supplier,
                totalPurchases,
                purchaseCount,
                lastPurchaseDate,
                lastPurchase: lastPurchaseDate,
                currentPayable
            };
        }));

        res.json({ suppliers: suppliersWithStats });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single supplier
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const supplier = await Supplier.findOne({ _id: req.params.id, companyId });

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Get both purchase orders and deliveries
        const [purchaseOrders, deliveries] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierName: supplier.name })
                .sort({ orderDate: -1, createdAt: -1 })
                .limit(50),
            DeliveryIn.find({ companyId, supplierName: supplier.name })
                .sort({ receiptDate: -1, createdAt: -1 })
                .limit(50)
        ]);

        res.json({ supplier, purchaseOrders, deliveries });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create supplier
router.post('/', authenticate, requirePermission('canManageSuppliers'), [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().trim(),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { name, contactPerson, phone, email, address, gstNumber, panNumber, paymentTerms, notes } = req.body;

        const supplier = new Supplier({
            companyId,
            name,
            contactPerson,
            phone,
            email,
            address,
            gstNumber,
            panNumber,
            paymentTerms,
            notes
        });

        await supplier.save();

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Supplier with this name already exists' });
        }
        console.error('Create supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update supplier
router.put('/:id', authenticate, requirePermission('canManageSuppliers'), [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Invalid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const updateData = req.body;

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, companyId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({
            message: 'Supplier updated successfully',
            supplier
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Supplier with this name already exists' });
        }
        console.error('Update supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete supplier
router.delete('/:id', authenticate, requirePermission('canManageSuppliers'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const supplier = await Supplier.findOneAndDelete({
            _id: req.params.id,
            companyId
        });

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Utility endpoint to recalculate currentPayable for all suppliers
router.post('/recalculate-payables', authenticate, requirePermission('canManageSuppliers'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        // Get all suppliers for this company
        const suppliers = await Supplier.find({ companyId });

        let updated = 0;

        for (const supplier of suppliers) {
            // Get all unpaid/partial purchase orders for this supplier
            const unpaidOrders = await PurchaseOrder.find({
                companyId,
                supplierName: supplier.name,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            // Calculate total payable
            const currentPayable = unpaidOrders.reduce((sum, order) => {
                const amountDue = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
                return sum + amountDue;
            }, 0);

            // Update supplier
            supplier.currentPayable = currentPayable;
            await supplier.save();
            updated++;
        }

        res.json({
            message: `Successfully recalculated payables for ${updated} suppliers`,
            updated
        });
    } catch (error) {
        console.error('Recalculate payables error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
