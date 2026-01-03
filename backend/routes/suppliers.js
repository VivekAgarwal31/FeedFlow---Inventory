import express from 'express';
import { body, validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryIn from '../models/DeliveryIn.js';
import DirectPurchase from '../models/DirectPurchase.js';
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
            const [purchaseOrders, directPurchases] = await Promise.all([
                PurchaseOrder.find({
                    companyId,
                    supplierName: supplier.name
                }).lean(),
                DirectPurchase.find({
                    companyId,
                    supplierId: supplier._id
                }).lean()
            ]);

            // Calculate totals from both sources
            const orderTotal = purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const directTotal = directPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
            const totalPurchases = orderTotal + directTotal;
            const purchaseCount = purchaseOrders.length + directPurchases.length;

            // Get most recent purchase date from both sources
            const orderDates = purchaseOrders.map(o => new Date(o.orderDate || o.createdAt)).filter(d => !isNaN(d));
            const directDates = directPurchases.map(p => new Date(p.purchaseDate || p.createdAt)).filter(d => !isNaN(d));
            const allDates = [...orderDates, ...directDates];

            const lastPurchaseDate = allDates.length > 0
                ? new Date(Math.max(...allDates))
                : null;

            // Calculate current payable from unpaid/partial orders AND direct purchases
            const unpaidOrders = purchaseOrders.filter(order =>
                order.paymentStatus === 'pending' || order.paymentStatus === 'partial'
            );
            const orderPayable = unpaidOrders.reduce((sum, order) => {
                const amountDue = order.amountDue || (order.totalAmount - (order.amountPaid || 0));
                return sum + amountDue;
            }, 0);

            // Get unpaid direct purchases
            const unpaidDirectPurchases = directPurchases.filter(purchase =>
                purchase.paymentStatus === 'pending' || purchase.paymentStatus === 'partial'
            );

            const directPurchasePayable = unpaidDirectPurchases.reduce((sum, purchase) => {
                const amountDue = purchase.totalAmount - (purchase.amountPaid || 0);
                return sum + amountDue;
            }, 0);

            const currentPayable = orderPayable + directPurchasePayable;

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

        // Get purchase orders, deliveries, and direct purchases
        const [purchaseOrders, deliveries, directPurchases] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierName: supplier.name })
                .sort({ orderDate: -1, createdAt: -1 })
                .limit(50),
            DeliveryIn.find({ companyId, supplierName: supplier.name })
                .sort({ receiptDate: -1, createdAt: -1 })
                .limit(50),
            DirectPurchase.find({ companyId, supplierId: supplier._id })
                .sort({ purchaseDate: -1, createdAt: -1 })
                .limit(50)
        ]);

        res.json({ supplier, purchaseOrders, deliveries, directPurchases });
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

        const { name, contactPerson, phone, email, address, gstNumber, panNumber, paymentTerms, notes, openingBalance } = req.body;

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
            notes,
            currentPayable: openingBalance && !isNaN(parseFloat(openingBalance)) ? parseFloat(openingBalance) : 0
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

// Bulk import suppliers from Excel
import multer from 'multer';
import ExcelJS from 'exceljs';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/bulk-import', authenticate, requirePermission('canManageSuppliers'), upload.single('file'), async (req, res) => {
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

        const suppliers = [];
        const errors = [];
        const existingNames = new Set();

        // Get existing supplier names for duplicate check
        const existingSuppliers = await Supplier.find({ companyId }).select('name').lean();
        existingSuppliers.forEach(s => existingNames.add(s.name.toLowerCase()));

        // Skip header row, start from row 2
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const name = row.getCell(1).value?.toString().trim();
            const contactPerson = row.getCell(2).value?.toString().trim() || '';
            const email = row.getCell(3).value?.toString().trim() || '';
            const phone = row.getCell(4).value?.toString().trim() || '';
            const address = row.getCell(5).value?.toString().trim() || '';
            const gstNumber = row.getCell(6).value?.toString().trim() || '';
            const panNumber = row.getCell(7).value?.toString().trim() || '';
            const paymentTerms = row.getCell(8).value?.toString().trim() || '';
            const notes = row.getCell(9).value?.toString().trim() || '';
            const openingBalance = parseFloat(row.getCell(10).value) || 0;

            // Validation
            if (!name || name.length < 2) {
                errors.push({ row: rowNumber, error: 'Name is required and must be at least 2 characters' });
                return;
            }

            // Check for duplicate
            const nameLower = name.toLowerCase();
            if (existingNames.has(nameLower)) {
                errors.push({ row: rowNumber, error: `Supplier "${name}" already exists` });
                return;
            }

            // Email validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push({ row: rowNumber, error: 'Invalid email format' });
                return;
            }

            existingNames.add(nameLower);
            suppliers.push({
                companyId,
                name,
                contactPerson,
                email,
                phone,
                address,
                gstNumber,
                panNumber,
                paymentTerms,
                notes,
                currentPayable: openingBalance
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

        // Bulk insert suppliers
        let successCount = 0;
        if (suppliers.length > 0) {
            const result = await Supplier.insertMany(suppliers, { ordered: false });
            successCount = result.length;
        }

        res.json({
            message: `Successfully imported ${successCount} supplier(s)`,
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
