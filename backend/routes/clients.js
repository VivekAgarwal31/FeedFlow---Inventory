import express from 'express';
import { body, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import SalesOrder from '../models/SalesOrder.js';
import DeliveryOut from '../models/DeliveryOut.js';
import DirectSale from '../models/DirectSale.js';
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

        // Calculate currentCredit for each client from unpaid sales orders AND direct sales
        for (const client of clients) {
            // Get unpaid sales orders
            const unpaidOrders = await SalesOrder.find({
                companyId,
                clientName: client.name,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            // Get unpaid direct sales
            const unpaidDirectSales = await DirectSale.find({
                companyId,
                clientId: client._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            // Calculate total credit from both sources
            const orderCredit = unpaidOrders.reduce((sum, order) => {
                const amountDue = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
                return sum + amountDue;
            }, 0);

            const directSaleCredit = unpaidDirectSales.reduce((sum, sale) => {
                const amountDue = sale.totalAmount - (sale.amountPaid || 0);
                return sum + amountDue;
            }, 0);

            client.currentCredit = orderCredit + directSaleCredit;

            // Get all sales orders AND direct sales for total purchases
            const [allOrders, allDirectSales] = await Promise.all([
                SalesOrder.find({
                    companyId,
                    clientName: client.name
                }).select('totalAmount orderDate'),
                DirectSale.find({
                    companyId,
                    clientId: client._id
                }).select('totalAmount saleDate')
            ]);

            // Calculate total purchases from both sources
            const orderTotal = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const directTotal = allDirectSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
            client.totalPurchases = orderTotal + directTotal;

            // Calculate sales count from both sources
            client.salesCount = allOrders.length + allDirectSales.length;

            // Get most recent transaction date from both sources
            const orderDates = allOrders.map(o => new Date(o.orderDate || o.createdAt)).filter(d => !isNaN(d));
            const directDates = allDirectSales.map(s => new Date(s.saleDate || s.createdAt)).filter(d => !isNaN(d));
            const allDates = [...orderDates, ...directDates];

            if (allDates.length > 0) {
                client.lastPurchaseDate = new Date(Math.max(...allDates));
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

        const { name, phone, email, address, gstNumber, notes, openingBalance } = req.body;

        // Create client
        const client = new Client({
            companyId,
            name,
            phone,
            email,
            address,
            gstNumber,
            notes,
            currentCredit: openingBalance && !isNaN(parseFloat(openingBalance)) ? parseFloat(openingBalance) : 0
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

        // Get sales orders, deliveries, and direct sales
        const [salesOrders, deliveries, directSales] = await Promise.all([
            SalesOrder.find({ companyId, clientName: client.name })
                .sort({ orderDate: -1, createdAt: -1 })
                .limit(50)
                .lean(),
            DeliveryOut.find({ companyId, clientName: client.name })
                .sort({ deliveryDate: -1, createdAt: -1 })
                .limit(50)
                .lean(),
            DirectSale.find({ companyId, clientId: client._id })
                .sort({ saleDate: -1, createdAt: -1 })
                .limit(50)
                .lean()
        ]);

        res.json({ client, salesOrders, deliveries, directSales });
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

// Bulk import clients from Excel
import multer from 'multer';
import ExcelJS from 'exceljs';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/bulk-import', authenticate, requirePermission('canManageClients'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        // Parse Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        const clients = [];
        const errors = [];
        const existingNames = new Set();

        // Get existing client names for duplicate check
        const existingClients = await Client.find({ companyId }).select('name').lean();
        existingClients.forEach(c => existingNames.add(c.name.toLowerCase()));

        // Skip header row, start from row 2
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const name = row.getCell(1).value?.toString().trim();
            const email = row.getCell(2).value?.toString().trim() || '';
            const phone = row.getCell(3).value?.toString().trim() || '';
            const address = row.getCell(4).value?.toString().trim() || '';
            const gstNumber = row.getCell(5).value?.toString().trim() || '';
            const notes = row.getCell(6).value?.toString().trim() || '';
            const openingBalance = parseFloat(row.getCell(7).value) || 0;

            // Validation
            if (!name || name.length < 2) {
                errors.push({ row: rowNumber, error: 'Name is required and must be at least 2 characters' });
                return;
            }

            // Check for duplicate within file
            const nameLower = name.toLowerCase();
            if (existingNames.has(nameLower)) {
                errors.push({ row: rowNumber, error: `Client "${name}" already exists` });
                return;
            }

            // Email validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push({ row: rowNumber, error: 'Invalid email format' });
                return;
            }

            existingNames.add(nameLower);
            clients.push({
                companyId,
                name,
                email,
                phone,
                address,
                gstNumber,
                notes,
                currentCredit: openingBalance
            });
        });

        // If there are validation errors, return them
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation errors found',
                errors,
                successCount: 0,
                failedCount: errors.length
            });
        }

        // Bulk insert clients
        let successCount = 0;
        if (clients.length > 0) {
            const result = await Client.insertMany(clients, { ordered: false });
            successCount = result.length;
        }

        res.json({
            message: `Successfully imported ${successCount} client(s)`,
            successCount,
            failedCount: errors.length,
            errors
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Server error during import', error: error.message });
    }
});

export default router;
