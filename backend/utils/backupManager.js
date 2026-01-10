import mongoose from 'mongoose';
import BackupMetadata from '../models/BackupMetadata.js';
import RestoreLog from '../models/RestoreLog.js';

// Get app version from package.json
const APP_VERSION = '1.0.0'; // TODO: Import from package.json

/**
 * Create a full backup of company data (JSON format, download-only)
 * @param {String} companyId - Company ID
 * @param {String} userId - User creating the backup
 * @returns {Promise<Object>} Backup data with metadata
 */
export const createFullBackup = async (companyId, userId) => {
    try {
        // Generate backup ID
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `BKP_${timestamp}_${companyId.slice(-8)}`;
        const fileName = `stockwise_backup_${new Date().toISOString().split('T')[0]}.json`;

        // Fetch company data
        const Company = mongoose.model('Company');
        const company = await Company.findById(companyId).lean();

        if (!company) {
            throw new Error('Company not found');
        }

        // Collections to backup
        const collections = [
            { name: 'stockItems', model: 'StockItem', key: 'stockItems' },
            { name: 'sales', model: 'DirectSale', key: 'sales' },
            { name: 'purchases', model: 'DirectPurchase', key: 'purchases' },
            { name: 'clients', model: 'Client', key: 'clients' },
            { name: 'suppliers', model: 'Supplier', key: 'suppliers' },
            { name: 'warehouses', model: 'Warehouse', key: 'warehouses' },
            { name: 'stockTransactions', model: 'StockTransaction', key: 'stockTransactions' },
            { name: 'users', model: 'User', key: 'users' },
            { name: 'salesOrders', model: 'SalesOrder', key: 'salesOrders' },
            { name: 'purchaseOrders', model: 'PurchaseOrder', key: 'purchaseOrders' },
            { name: 'deliveryOuts', model: 'DeliveryOut', key: 'deliveryOuts' },
            { name: 'deliveryIns', model: 'DeliveryIn', key: 'deliveryIns' }
        ];

        const data = {};
        const recordCounts = {};

        // Fetch all data
        for (const { name, model: modelName, key } of collections) {
            try {
                const Model = mongoose.model(modelName);
                const records = await Model.find({ companyId }).lean();
                data[key] = records;
                recordCounts[key] = records.length;
            } catch (error) {
                console.error(`Error fetching ${name}:`, error.message);
                data[key] = [];
                recordCounts[key] = 0;
            }
        }

        // Build backup object
        const backup = {
            metadata: {
                backupId,
                companyId: companyId.toString(),
                companyName: company.name,
                recordCounts,
                createdAt: new Date().toISOString(),
                appVersion: APP_VERSION
            },
            data: {
                company,
                ...data
            }
        };

        // Save backup metadata to database (for history)
        const backupMetadata = new BackupMetadata({
            backupId,
            companyId,
            fileName,
            recordCounts,
            appVersion: APP_VERSION,
            createdBy: userId,
            downloaded: false
        });

        await backupMetadata.save();

        return {
            backupId,
            fileName,
            backup,
            metadata: backup.metadata
        };
    } catch (error) {
        console.error('Backup creation error:', error);
        throw error;
    }
};

/**
 * Mark backup as downloaded
 * @param {String} backupId - Backup ID
 */
export const markBackupDownloaded = async (backupId) => {
    await BackupMetadata.findOneAndUpdate(
        { backupId },
        { downloaded: true, downloadedAt: new Date() }
    );
};

/**
 * Get backup history for a company
 * @param {String} companyId - Company ID
 * @returns {Promise<Array>} List of backups
 */
export const getBackupHistory = async (companyId) => {
    const backups = await BackupMetadata.find({ companyId })
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();

    return backups;
};

/**
 * Validate backup file
 * @param {Object} backupData - Parsed backup JSON
 * @param {String} companyId - Current company ID
 * @returns {Object} Validation result
 */
export const validateBackup = (backupData, companyId) => {
    const warnings = [];

    // Check structure
    if (!backupData.metadata || !backupData.data) {
        return {
            valid: false,
            error: 'Invalid backup file structure'
        };
    }

    const { metadata } = backupData;

    // Check required metadata fields
    if (!metadata.backupId || !metadata.companyId || !metadata.companyName) {
        return {
            valid: false,
            error: 'Missing required metadata fields'
        };
    }

    // Check company ID match
    if (metadata.companyId !== companyId.toString()) {
        return {
            valid: false,
            error: 'Backup belongs to a different company'
        };
    }

    // Check app version compatibility (major version must match)
    if (metadata.appVersion) {
        const backupMajor = metadata.appVersion.split('.')[0];
        const currentMajor = APP_VERSION.split('.')[0];

        if (backupMajor !== currentMajor) {
            warnings.push(`App version mismatch: Backup v${metadata.appVersion}, Current v${APP_VERSION}`);
        }
    }

    // Check backup age
    const backupDate = new Date(metadata.createdAt);
    const daysSinceBackup = Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceBackup > 30) {
        warnings.push(`Backup is ${daysSinceBackup} days old`);
    }

    return {
        valid: true,
        metadata,
        warnings
    };
};

/**
 * Restore specific modules from backup (partial restore)
 * @param {String} companyId - Company ID
 * @param {Object} backupData - Parsed backup JSON
 * @param {Array} modulesToRestore - Array of module names to restore
 * @param {String} userId - User performing restore
 * @returns {Promise<Object>} Restore result
 */
export const restorePartial = async (companyId, backupData, modulesToRestore, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { metadata, data } = backupData;
        const restored = {};

        // Module mapping
        const moduleMap = {
            stockItems: { model: 'StockItem', key: 'stockItems' },
            sales: { model: 'DirectSale', key: 'sales' },
            purchases: { model: 'DirectPurchase', key: 'purchases' },
            clients: { model: 'Client', key: 'clients' },
            suppliers: { model: 'Supplier', key: 'suppliers' },
            warehouses: { model: 'Warehouse', key: 'warehouses' },
            stockTransactions: { model: 'StockTransaction', key: 'stockTransactions' },
            users: { model: 'User', key: 'users' },
            salesOrders: { model: 'SalesOrder', key: 'salesOrders' },
            purchaseOrders: { model: 'PurchaseOrder', key: 'purchaseOrders' },
            deliveryOuts: { model: 'DeliveryOut', key: 'deliveryOuts' },
            deliveryIns: { model: 'DeliveryIn', key: 'deliveryIns' }
        };

        // Restore each selected module
        for (const moduleName of modulesToRestore) {
            const moduleInfo = moduleMap[moduleName];

            if (!moduleInfo) {
                console.warn(`Unknown module: ${moduleName}`);
                continue;
            }

            const { model: modelName, key } = moduleInfo;
            const Model = mongoose.model(modelName);
            const records = data[key] || [];

            if (records.length === 0) {
                restored[moduleName] = 0;
                continue;
            }

            // Delete existing data for this module
            await Model.deleteMany({ companyId }, { session });

            // Insert backup data
            const recordsToInsert = records.map(record => ({
                ...record,
                companyId // Ensure company ID is correct
            }));

            await Model.insertMany(recordsToInsert, { session });
            restored[moduleName] = records.length;
        }

        // Log restore operation
        const restoreLog = new RestoreLog({
            companyId,
            backupId: metadata.backupId,
            restoreType: 'partial',
            modulesRestored: modulesToRestore,
            recordsRestored: restored,
            status: 'success',
            restoredBy: userId
        });

        await restoreLog.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            restored
        };
    } catch (error) {
        await session.abortTransaction();
        console.error('Partial restore error:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Restore entire company from backup (full restore)
 * @param {String} companyId - Company ID
 * @param {Object} backupData - Parsed backup JSON
 * @param {String} userId - User performing restore
 * @returns {Promise<Object>} Restore result
 */
export const restoreFull = async (companyId, backupData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { metadata, data } = backupData;
        const restored = {};

        // All modules
        const modules = [
            { name: 'stockItems', model: 'StockItem', key: 'stockItems' },
            { name: 'sales', model: 'DirectSale', key: 'sales' },
            { name: 'purchases', model: 'DirectPurchase', key: 'purchases' },
            { name: 'clients', model: 'Client', key: 'clients' },
            { name: 'suppliers', model: 'Supplier', key: 'suppliers' },
            { name: 'warehouses', model: 'Warehouse', key: 'warehouses' },
            { name: 'stockTransactions', model: 'StockTransaction', key: 'stockTransactions' },
            { name: 'users', model: 'User', key: 'users' },
            { name: 'salesOrders', model: 'SalesOrder', key: 'salesOrders' },
            { name: 'purchaseOrders', model: 'PurchaseOrder', key: 'purchaseOrders' },
            { name: 'deliveryOuts', model: 'DeliveryOut', key: 'deliveryOuts' },
            { name: 'deliveryIns', model: 'DeliveryIn', key: 'deliveryIns' }
        ];

        // Delete all existing data
        for (const { model: modelName } of modules) {
            const Model = mongoose.model(modelName);
            await Model.deleteMany({ companyId }, { session });
        }

        // Restore all data
        for (const { name, model: modelName, key } of modules) {
            const Model = mongoose.model(modelName);
            const records = data[key] || [];

            if (records.length === 0) {
                restored[name] = 0;
                continue;
            }

            const recordsToInsert = records.map(record => ({
                ...record,
                companyId
            }));

            await Model.insertMany(recordsToInsert, { session });
            restored[name] = records.length;
        }

        // Update company settings
        if (data.company) {
            const Company = mongoose.model('Company');
            await Company.findByIdAndUpdate(
                companyId,
                {
                    $set: {
                        settings: data.company.settings,
                        industry: data.company.industry,
                        address: data.company.address,
                        phone: data.company.phone,
                        email: data.company.email,
                        website: data.company.website,
                        taxId: data.company.taxId,
                        logo: data.company.logo
                    }
                },
                { session }
            );
        }

        // Log restore operation
        const restoreLog = new RestoreLog({
            companyId,
            backupId: metadata.backupId,
            restoreType: 'full',
            modulesRestored: modules.map(m => m.name),
            recordsRestored: restored,
            status: 'success',
            restoredBy: userId
        });

        await restoreLog.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            restored
        };
    } catch (error) {
        await session.abortTransaction();
        console.error('Full restore error:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get restore history for a company
 * @param {String} companyId - Company ID
 * @returns {Promise<Array>} List of restores
 */
export const getRestoreHistory = async (companyId) => {
    const restores = await RestoreLog.find({ companyId })
        .populate('restoredBy', 'fullName email')
        .sort({ restoredAt: -1 })
        .limit(50)
        .lean();

    return restores;
};
