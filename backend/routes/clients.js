import express from 'express';
import { body, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import SalesOrder from '../models/SalesOrder.js';
import DeliveryOut from '../models/DeliveryOut.js';
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
            .sort({ name: 1 })
            .lean();

        // Calculate currentCredit for each client from unpaid sales orders
        for (const client of clients) {
            // Get unpaid sales orders
            const unpaidOrders = await SalesOrder.find({
                companyId,
                clientName: client.name,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            // Calculate total credit
            client.currentCredit = unpaidOrders.reduce((sum, order) => {
                const amountDue = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
                return sum + amountDue;
            }, 0);

            // Get most recent order for lastPurchaseDate
            const mostRecentOrder = await SalesOrder.findOne({
                companyId,
                clientName: client.name
            }).sort({ orderDate: -1 }).select('orderDate');

            if (mostRecentOrder) {
                client.lastPurchaseDate = mostRecentOrder.orderDate;
            }
        }

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

        const client = await Client.findOne({ _id: req.params.id, companyId }).lean();

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Get both sales orders and deliveries
        const [salesOrders, deliveries] = await Promise.all([
            SalesOrder.find({ companyId, clientName: client.name })
                .sort({ orderDate: -1, createdAt: -1 })
                .limit(50)
                .lean(),
            DeliveryOut.find({ companyId, clientName: client.name })
                .sort({ deliveryDate: -1, createdAt: -1 })
                .limit(50)
                .lean()
        ]);

        res.json({ client, salesOrders, deliveries });
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

// Update client credit limit
router.put('/:id/credit-limit', authenticate, requirePermission('canManageClients'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { creditLimit, paymentTerms, defaultDueDays } = req.body;

        const client = await Client.findOne({ _id: req.params.id, companyId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Update credit settings
        if (creditLimit !== undefined) client.creditLimit = creditLimit;
        if (paymentTerms !== undefined) client.paymentTerms = paymentTerms;
        if (defaultDueDays !== undefined) client.defaultDueDays = defaultDueDays;

        // Update credit status
        client.updateCreditStatus();

        await client.save();

        res.json({
            message: 'Credit limit updated successfully',
            client
        });
    } catch (error) {
        console.error('Update credit limit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client credit status
router.get('/:id/credit-status', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const client = await Client.findOne({ _id: req.params.id, companyId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json({
            creditLimit: client.creditLimit,
            currentCredit: client.currentCredit,
            creditUsed: client.creditUsed,
            available: Math.max(0, client.creditLimit - client.currentCredit),
            creditStatus: client.creditStatus,
            paymentTerms: client.paymentTerms,
            overdueAmount: client.overdueAmount
        });
    } catch (error) {
        console.error('Get credit status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client payment history
router.get('/:id/payment-history', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const Payment = (await import('../models/Payment.js')).default;

        const payments = await Payment.find({
            companyId,
            partyId: req.params.id,
            partyType: 'client'
        })
            .sort({ paymentDate: -1 })
            .limit(50);

        res.json({ payments });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
