import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { checkBackupAccess } from '../middleware/subscriptionMiddleware.js';
import { exportToCSV, exportToExcel, generateImportTemplate, getEntityFields } from '../utils/dataExport.js';
import { parseCSV, parseExcel, validateImportData, mapImportHeaders, importWithTransaction } from '../utils/dataImport.js';
import { createBackup, listBackups, restoreBackup, deleteBackup, getBackupFilePath } from '../utils/backup.js';
import { archiveOldRecords, getArchivedRecords, restoreFromArchive, getArchiveStats } from '../utils/archival.js';
import { analyzeOrphanedRecords, findDuplicates, cleanupOrphans, optimizeDatabase, getCleanupHistory } from '../utils/cleanup.js';
import StockItem from '../models/StockItem.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryIn from '../models/DeliveryIn.js';
import DeliveryOut from '../models/DeliveryOut.js';
import Payment from '../models/Payment.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Warehouse from '../models/Warehouse.js';
import StockTransaction from '../models/StockTransaction.js';
import BackupMetadata from '../models/BackupMetadata.js';
import Company from '../models/Company.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
        }
    }
});

// Model mapping
const getModel = (entityType) => {
    const models = {
        stockItems: StockItem,
        salesOrders: SalesOrder,
        purchaseOrders: PurchaseOrder,
        deliveryIns: DeliveryIn,
        deliveryOuts: DeliveryOut,
        payments: Payment,
        clients: Client,
        suppliers: Supplier,
        warehouses: Warehouse,
        stockTransactions: StockTransaction,
        // Backward compatibility
        sales: SalesOrder,
        purchases: PurchaseOrder
    };
    return models[entityType];
};

// Middleware to check if user is owner
const requireOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Owner access required' });
    }
    next();
};

// ==================== EXPORT ENDPOINTS ====================

/**
 * Export entity data
 * GET /api/data-management/export/:entity?format=csv|excel
 */
router.get('/export/:entity', authenticate, async (req, res) => {
    try {
        const { entity } = req.params;
        const { format = 'excel' } = req.query;
        const companyId = req.user.companyId._id;

        const Model = getModel(entity);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid entity type' });
        }

        // Fetch data
        let data;
        if (entity === 'stockItems') {
            // Populate warehouse for stock items
            data = await Model.find({ companyId }).populate('warehouseId', 'name').lean();
        } else if (entity === 'sales') {
            // For sales, we need to fetch DeliveryOut and populate salesOrderId for payment data
            const DeliveryOut = mongoose.model('DeliveryOut');
            data = await DeliveryOut.find({ companyId })
                .populate('salesOrderId')
                .sort({ deliveryDate: -1 })
                .lean();

            // Transform data to match export format
            data = data.map(delivery => {
                const salesOrder = delivery.salesOrderId;

                // Format items as "ItemName (Warehouse - Quantity)"
                const itemsText = delivery.items && delivery.items.length > 0
                    ? delivery.items.map(item =>
                        `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                    ).join(', ')
                    : 'N/A';

                return {
                    saleDate: delivery.deliveryDate,
                    clientName: delivery.clientName || 'N/A',
                    staffName: delivery.staffName || 'N/A',
                    items: itemsText,
                    totalAmount: delivery.totalAmount || 0,
                    paymentStatus: salesOrder?.paymentStatus || 'pending',
                    paidAmount: salesOrder?.amountPaid || 0,
                    pendingAmount: salesOrder?.amountDue || delivery.totalAmount || 0
                };
            });
        } else if (entity === 'purchases') {
            // For purchases, we need to fetch DeliveryIn and populate purchaseOrderId for payment data
            const DeliveryIn = mongoose.model('DeliveryIn');
            data = await DeliveryIn.find({ companyId })
                .populate('purchaseOrderId')
                .sort({ receiptDate: -1 })
                .lean();

            // Transform data to match export format
            data = data.map(delivery => {
                const purchaseOrder = delivery.purchaseOrderId;

                // Format items as "ItemName (Warehouse - Quantity)"
                const itemsText = delivery.items && delivery.items.length > 0
                    ? delivery.items.map(item =>
                        `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                    ).join(', ')
                    : 'N/A';

                return {
                    purchaseDate: delivery.receiptDate,
                    supplierName: delivery.supplierName || 'N/A',
                    staffName: delivery.staffName || 'N/A',
                    items: itemsText,
                    totalAmount: delivery.totalAmount || 0,
                    paymentStatus: purchaseOrder?.paymentStatus || 'pending',
                    paidAmount: purchaseOrder?.amountPaid || 0,
                    pendingAmount: purchaseOrder?.amountDue || delivery.totalAmount || 0
                };
            });
        } else {
            data = await Model.find({ companyId }).lean();
        }

        // Special handling for stock items - consolidate by item name
        if (entity === 'stockItems') {
            const consolidated = {};

            data.forEach(item => {
                const key = item.itemName;
                if (!consolidated[key]) {
                    consolidated[key] = {
                        itemName: item.itemName,
                        category: item.category,
                        itemCategory: item.itemCategory,
                        bagSize: item.bagSize,
                        quantity: 0,
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        lowStockAlert: item.lowStockAlert,
                        warehouses: {}
                    };
                }

                // Add to total quantity
                consolidated[key].quantity += item.quantity || 0;

                // Track warehouse distribution
                if (item.warehouseId) {
                    const warehouseName = typeof item.warehouseId === 'object' ? item.warehouseId.name : item.warehouseId;
                    consolidated[key].warehouses[warehouseName] = (consolidated[key].warehouses[warehouseName] || 0) + (item.quantity || 0);
                }
            });


            // Convert warehouses object to string format
            data = Object.values(consolidated).map(item => {
                const warehouseStr = Object.entries(item.warehouses)
                    .map(([name, qty]) => `${name}: ${qty}`)
                    .join(', ');

                console.log('Item:', item.itemName, 'Warehouses:', item.warehouses, 'String:', warehouseStr);

                return {
                    ...item,
                    warehouse: warehouseStr || 'No warehouse data'
                };
            });
        }

        // Get field definitions
        const fields = getEntityFields(entity);

        // Generate export
        if (format === 'csv') {
            const csv = exportToCSV(data, fields);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${entity}_${Date.now()}.csv"`);
            res.send(csv);
        } else {
            const buffer = await exportToExcel(data, fields, entity);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${entity}_${Date.now()}.xlsx"`);
            res.send(buffer);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export data', error: error.message });
    }
});

/**
 * Download import template
 * GET /api/data-management/template/:entity?format=csv|excel
 */
router.get('/template/:entity', authenticate, async (req, res) => {
    try {
        const { entity } = req.params;
        const { format = 'excel' } = req.query;

        const template = await generateImportTemplate(entity, format);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${entity}_template.csv"`);
            res.send(template);
        } else {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${entity}_template.xlsx"`);
            res.send(template);
        }
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ message: 'Failed to generate template', error: error.message });
    }
});

// ==================== IMPORT ENDPOINTS ====================

/**
 * Import data from file
 * POST /api/data-management/import/:entity
 */
router.post('/import/:entity', authenticate, upload.single('file'), async (req, res) => {
    try {
        const { entity } = req.params;
        const companyId = req.user.companyId._id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const Model = getModel(entity);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid entity type' });
        }

        // Parse file
        let data;
        if (req.file.mimetype === 'text/csv') {
            data = parseCSV(req.file.buffer);
        } else {
            data = await parseExcel(req.file.buffer);
        }

        // Validate data
        const validation = validateImportData(data, entity);
        if (!validation.valid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Map headers to database fields
        const mappedData = mapImportHeaders(data, entity);

        // Import with transaction
        const result = await importWithTransaction(
            mappedData,
            Model,
            companyId,
            { createdAt: new Date(), updatedAt: new Date() }
        );

        res.json({
            message: 'Import completed',
            ...result
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Failed to import data', error: error.message });
    }
});

// ==================== BACKUP ENDPOINTS ====================

/**
 * Create manual backup
 * POST /api/data-management/backup/create
 */
router.post('/backup/create', authenticate, requireOwner, checkBackupAccess, async (req, res) => {
    try {
        console.log('Starting backup creation...');
        const companyId = req.user.companyId._id;
        const companyName = req.user.companyId.name;
        console.log('Company:', companyName, 'ID:', companyId);

        console.log('Creating backup file...');
        const backupData = await createBackup(companyId, companyName);
        console.log('Backup file created:', backupData);

        // Save metadata
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days retention

        console.log('Saving backup metadata...');
        const metadata = await BackupMetadata.create({
            ...backupData,
            companyId,
            createdBy: req.user._id,
            expiresAt
        });
        console.log('Metadata saved:', metadata._id);

        res.json({
            message: 'Backup created successfully',
            backup: metadata
        });
    } catch (error) {
        console.error('Backup creation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to create backup', error: error.message });
    }
});

/**
 * List backups
 * GET /api/data-management/backup/list
 */
router.get('/backup/list', authenticate, requireOwner, checkBackupAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId._id;
        const backups = await listBackups(companyId);

        res.json({ backups });
    } catch (error) {
        console.error('List backups error:', error);
        res.status(500).json({ message: 'Failed to list backups', error: error.message });
    }
});

/**
 * Download backup
 * GET /api/data-management/backup/download/:backupId
 */
router.get('/backup/download/:backupId', authenticate, requireOwner, checkBackupAccess, async (req, res) => {
    try {
        const { backupId } = req.params;
        const filePath = await getBackupFilePath(backupId);

        res.download(filePath);
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({ message: 'Failed to download backup', error: error.message });
    }
});

/**
 * Restore from backup
 * POST /api/data-management/backup/restore
 */
router.post('/backup/restore', authenticate, requireOwner, checkBackupAccess, async (req, res) => {
    try {
        const { backupId } = req.body;
        const companyId = req.user.companyId._id;

        const filePath = await getBackupFilePath(backupId);
        const result = await restoreBackup(companyId, filePath);

        res.json({
            message: 'Restore completed successfully',
            ...result
        });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ message: 'Failed to restore backup', error: error.message });
    }
});

/**
 * Delete backup
 * DELETE /api/data-management/backup/:backupId
 */
router.delete('/backup/:backupId', authenticate, requireOwner, async (req, res) => {
    try {
        const { backupId } = req.params;
        const companyId = req.user.companyId._id;

        const backup = await BackupMetadata.findOne({ backupId, companyId });
        if (!backup) {
            return res.status(404).json({ message: 'Backup not found' });
        }

        await deleteBackup(backup.filePath);
        await BackupMetadata.deleteOne({ _id: backup._id });

        res.json({ message: 'Backup deleted successfully' });
    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({ message: 'Failed to delete backup', error: error.message });
    }
});

// ==================== ARCHIVE ENDPOINTS ====================

/**
 * Archive old records
 * POST /api/data-management/archive/create
 */
router.post('/archive/create', authenticate, async (req, res) => {
    try {
        const { entity, cutoffDate } = req.body;
        const companyId = req.user.companyId._id;
        const userId = req.user._id;

        const result = await archiveOldRecords(companyId, entity, new Date(cutoffDate), userId);

        res.json({
            message: 'Archive completed successfully',
            ...result
        });
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({ message: 'Failed to archive records', error: error.message });
    }
});

/**
 * Get archived records
 * GET /api/data-management/archive/:entity?page=1&limit=50
 */
router.get('/archive/:entity', authenticate, async (req, res) => {
    try {
        const { entity } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const companyId = req.user.companyId._id;

        const result = await getArchivedRecords(companyId, entity, {}, parseInt(page), parseInt(limit));

        res.json(result);
    } catch (error) {
        console.error('Get archived records error:', error);
        res.status(500).json({ message: 'Failed to get archived records', error: error.message });
    }
});

/**
 * Restore from archive
 * POST /api/data-management/archive/restore
 */
router.post('/archive/restore', authenticate, async (req, res) => {
    try {
        const { entity, recordIds } = req.body;
        const companyId = req.user.companyId._id;

        const result = await restoreFromArchive(companyId, entity, recordIds);

        res.json({
            message: 'Restore from archive completed',
            ...result
        });
    } catch (error) {
        console.error('Restore from archive error:', error);
        res.status(500).json({ message: 'Failed to restore from archive', error: error.message });
    }
});

/**
 * Get archive statistics
 * GET /api/data-management/archive/stats
 */
router.get('/archive/stats', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId._id;
        const stats = await getArchiveStats(companyId);

        res.json({ stats });
    } catch (error) {
        console.error('Archive stats error:', error);
        res.status(500).json({ message: 'Failed to get archive stats', error: error.message });
    }
});

// ==================== CLEANUP ENDPOINTS ====================

/**
 * Analyze cleanup opportunities
 * GET /api/data-management/cleanup/analyze
 */
router.get('/cleanup/analyze', authenticate, requireOwner, async (req, res) => {
    try {
        const companyId = req.user.companyId._id;

        const orphanedAnalysis = await analyzeOrphanedRecords(companyId);

        // Check for duplicates in each entity
        const duplicates = {
            clients: await findDuplicates(companyId, 'clients'),
            suppliers: await findDuplicates(companyId, 'suppliers'),
            warehouses: await findDuplicates(companyId, 'warehouses')
        };

        res.json({
            orphaned: orphanedAnalysis,
            duplicates
        });
    } catch (error) {
        console.error('Cleanup analysis error:', error);
        res.status(500).json({ message: 'Failed to analyze cleanup', error: error.message });
    }
});

/**
 * Execute cleanup
 * POST /api/data-management/cleanup/execute
 */
router.post('/cleanup/execute', authenticate, requireOwner, async (req, res) => {
    try {
        const { dryRun = true } = req.body;
        const companyId = req.user.companyId._id;
        const userId = req.user._id;

        const result = await cleanupOrphans(companyId, dryRun, userId);

        res.json({
            message: dryRun ? 'Cleanup analysis completed' : 'Cleanup executed successfully',
            ...result
        });
    } catch (error) {
        console.error('Cleanup execution error:', error);
        res.status(500).json({ message: 'Failed to execute cleanup', error: error.message });
    }
});

/**
 * Optimize database
 * POST /api/data-management/cleanup/optimize
 */
router.post('/cleanup/optimize', authenticate, requireOwner, async (req, res) => {
    try {
        const companyId = req.user.companyId._id;
        const result = await optimizeDatabase(companyId);

        res.json({
            message: 'Database optimization completed',
            results: result
        });
    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({ message: 'Failed to optimize database', error: error.message });
    }
});

/**
 * Get cleanup history
 * GET /api/data-management/cleanup/history
 */
router.get('/cleanup/history', authenticate, requireOwner, async (req, res) => {
    try {
        const companyId = req.user.companyId._id;
        const history = await getCleanupHistory(companyId);

        res.json({ history });
    } catch (error) {
        console.error('Cleanup history error:', error);
        res.status(500).json({ message: 'Failed to get cleanup history', error: error.message });
    }
});

export default router;
