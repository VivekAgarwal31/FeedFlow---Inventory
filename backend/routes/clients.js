import express from 'express';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const clients = await Client.find({ companyId })
            .sort({ totalRevenue: -1 }) // Top clients first
            .lean();

        res.json({ clients });
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
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
router.put('/:id', authenticate, async (req, res) => {
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

export default router;
