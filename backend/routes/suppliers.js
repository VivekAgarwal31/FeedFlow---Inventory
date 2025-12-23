import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import { authenticate } from '../middleware/auth.js';

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
            const purchases = await Purchase.find({
                companyId,
                supplierId: supplier._id
            }).lean();

            const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
            const purchaseCount = purchases.length;
            const lastPurchaseDate = purchases.length > 0
                ? purchases.reduce((latest, p) => {
                    const pDate = new Date(p.purchaseDate || p.createdAt);
                    return pDate > latest ? pDate : latest;
                }, new Date(0))
                : null;

            return {
                ...supplier,
                totalPurchases,
                purchaseCount,
                lastPurchaseDate,
                lastPurchase: lastPurchaseDate
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

        const [supplier, purchases] = await Promise.all([
            Supplier.findOne({ _id: req.params.id, companyId }),
            Purchase.find({ companyId, supplierId: req.params.id })
                .sort({ purchaseDate: -1 })
                .limit(50)
        ]);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ supplier, purchases });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create supplier
router.post('/', authenticate, [
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
router.put('/:id', authenticate, [
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
router.delete('/:id', authenticate, async (req, res) => {
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

export default router;
