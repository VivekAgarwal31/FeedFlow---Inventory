import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

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

        res.json({ suppliers });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single supplier
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            companyId
        }).lean();

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ supplier });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create supplier
router.post('/', authenticate, [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email')
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
