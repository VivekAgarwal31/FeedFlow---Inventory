import express from 'express';
import { body, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get client list for dropdowns
router.get('/list', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const clients = await Client.find({ companyId, isActive: true })
            .select('_id name')
            .sort({ name: 1 })
            .lean();

        res.json({ clients });
    } catch (error) {
        console.error('Get client list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all clients
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const clients = await Client.find({ companyId })
            .sort({ name: 1 });

        res.json({ clients });
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new client
router.post('/', authenticate, requirePermission('canManageClients'), [
    body('name').trim().isLength({ min: 2 }).withMessage('Client name is required'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('address').optional({ checkFalsy: true }).trim(),
    body('gstNumber').optional({ checkFalsy: true }).trim(),
    body('notes').optional({ checkFalsy: true }).trim()
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

        const { name, phone, email, address, gstNumber, notes } = req.body;

        // Create client
        const client = new Client({
            companyId,
            name,
            phone,
            email,
            address,
            gstNumber,
            notes
        });

        await client.save();

        res.status(201).json({
            message: 'Client created successfully',
            client
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Client with this name already exists in your company' });
        }
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get client with sales history
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const [client, sales] = await Promise.all([
            Client.findOne({ _id: req.params.id, companyId }).lean(),
            Sale.find({ companyId, clientId: req.params.id })
                .sort({ saleDate: -1 })
                .limit(50)
                .lean()
        ]);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json({ client, sales });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client
router.put('/:id', authenticate, requirePermission('canManageClients'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { name, phone, email, address, gstNumber, notes } = req.body;

        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { name, phone, email, address, gstNumber, notes },
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json({
            message: 'Client updated successfully',
            client
        });
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client
router.delete('/:id', authenticate, requirePermission('canManageClients'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const client = await Client.findOneAndDelete({
            _id: req.params.id,
            companyId
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Note: We don't delete sales, they remain for historical records
        // Sales will still have clientName even if client is deleted

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
