import archiver from 'archiver';
import extract from 'extract-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', 'temp', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a full backup of company data
 * @param {String} companyId - Company ID
 * @param {String} companyName - Company name for file naming
 * @returns {Promise<Object>} Backup metadata
 */
export const createBackup = async (companyId, companyName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${companyName.replace(/\s+/g, '_')}_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, `${backupId}.zip`);
    const tempDir = path.join(BACKUP_DIR, backupId);

    try {
        // Create temp directory for JSON files
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Collections to backup with their model names
        const collections = [
            { collection: 'users', model: 'User' },
            { collection: 'warehouses', model: 'Warehouse' },
            { collection: 'stockitems', model: 'StockItem' },
            { collection: 'clients', model: 'Client' },
            { collection: 'suppliers', model: 'Supplier' },
            { collection: 'salesorders', model: 'SalesOrder' },
            { collection: 'purchaseorders', model: 'PurchaseOrder' },
            { collection: 'deliveryins', model: 'DeliveryIn' },
            { collection: 'deliveryouts', model: 'DeliveryOut' },
            { collection: 'directsales', model: 'DirectSale' },
            { collection: 'directpurchases', model: 'DirectPurchase' },
            { collection: 'payments', model: 'Payment' },
            { collection: 'stocktransactions', model: 'StockTransaction' }
        ];

        const recordCounts = {};

        // Export each collection
        for (const { collection, model: modelName } of collections) {
            try {
                console.log(`Exporting ${collection} (model: ${modelName})...`);
                const model = mongoose.model(modelName);
                console.log(`Model loaded: ${modelName}`);

                const data = await model.find({ companyId }).lean();
                console.log(`Found ${data.length} records for ${collection}`);

                recordCounts[collection] = data.length;

                const filePath = path.join(tempDir, `${collection}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`Saved ${collection} to ${filePath}`);
            } catch (error) {
                console.error(`Error exporting ${collection}:`, error.message);
                console.error('Stack:', error.stack);
                throw error;
            }
        }

        // Export company metadata
        const Company = mongoose.model('Company');
        const companyData = await Company.findById(companyId).lean();
        if (companyData) {
            const companyFilePath = path.join(tempDir, 'company.json');
            fs.writeFileSync(companyFilePath, JSON.stringify(companyData, null, 2));
            console.log('Saved company metadata');
        }

        // Create enhanced metadata file
        const metadata = {
            backupId,
            companyId,
            companyName,
            timestamp: new Date().toISOString(),
            version: '2.0', // Enhanced version
            backupType: 'full_company',
            sections: [
                'company',
                'users',
                'warehouses',
                'stockitems',
                'clients',
                'suppliers',
                'salesorders',
                'purchaseorders',
                'deliveryins',
                'deliveryouts',
                'directsales',
                'directpurchases',
                'payments',
                'stocktransactions'
            ],
            recordCounts,
            description: 'Full company backup including all data and settings'
        };

        fs.writeFileSync(
            path.join(tempDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        // Create ZIP archive
        await createZipArchive(tempDir, backupPath);

        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        // Get file size
        const stats = fs.statSync(backupPath);

        return {
            backupId,
            fileName: `${backupId}.zip`,
            filePath: backupPath,
            fileSize: stats.size,
            recordCounts,
            createdAt: new Date()
        };
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        throw error;
    }
};

/**
 * Create ZIP archive from directory
 * @param {String} sourceDir - Source directory
 * @param {String} outPath - Output ZIP path
 * @returns {Promise<void>}
 */
const createZipArchive = (sourceDir, outPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
};

/**
 * List all backups for a company
 * @param {String} companyId - Company ID
 * @returns {Promise<Array>} List of backups
 */
export const listBackups = async (companyId) => {
    const BackupMetadata = mongoose.model('BackupMetadata');
    const backups = await BackupMetadata.find({ companyId })
        .sort({ createdAt: -1 })
        .lean();

    // Check if files still exist
    return backups.map(backup => ({
        ...backup,
        fileExists: fs.existsSync(backup.filePath)
    }));
};

/**
 * Restore from backup
 * @param {String} companyId - Company ID
 * @param {String} backupFilePath - Path to backup ZIP file
 * @returns {Promise<Object>} Restore result
 */
export const restoreBackup = async (companyId, backupFilePath) => {
    const tempDir = path.join(BACKUP_DIR, `restore_${Date.now()}`);

    try {
        // Extract ZIP
        await extract(backupFilePath, { dir: tempDir });

        // Read metadata
        const metadataPath = path.join(tempDir, 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

        // Verify company ID matches
        if (metadata.companyId !== companyId) {
            throw new Error('Backup belongs to a different company');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Collections to restore with their model names
            const collections = [
                { collection: 'warehouses', model: 'Warehouse' },
                { collection: 'stockitems', model: 'StockItem' },
                { collection: 'clients', model: 'Client' },
                { collection: 'suppliers', model: 'Supplier' },
                { collection: 'salesorders', model: 'SalesOrder' },
                { collection: 'purchaseorders', model: 'PurchaseOrder' },
                { collection: 'deliveryins', model: 'DeliveryIn' },
                { collection: 'deliveryouts', model: 'DeliveryOut' },
                { collection: 'directsales', model: 'DirectSale' },
                { collection: 'directpurchases', model: 'DirectPurchase' },
                { collection: 'payments', model: 'Payment' },
                { collection: 'stocktransactions', model: 'StockTransaction' },
                // Backward compatibility for old backups
                { collection: 'sales', model: 'SalesOrder' },
                { collection: 'purchases', model: 'PurchaseOrder' }
            ];

            const restoredCounts = {};

            // Delete existing data
            for (const { collection, model: modelName } of collections) {
                const model = mongoose.model(modelName);
                const result = await model.deleteMany({ companyId }, { session });
                console.log(`Deleted ${result.deletedCount} records from ${collection}`);
            }

            // Restore data
            for (const { collection, model: modelName } of collections) {
                const filePath = path.join(tempDir, `${collection}.json`);

                if (fs.existsSync(filePath)) {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    if (data.length > 0) {
                        const model = mongoose.model(modelName);
                        await model.insertMany(data, { session });
                        restoredCounts[collection] = data.length;
                    }
                }
            }

            await session.commitTransaction();

            return {
                success: true,
                restoredCounts,
                metadata
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } finally {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
};

/**
 * Delete a backup file
 * @param {String} backupFilePath - Path to backup file
 * @returns {Promise<void>}
 */
export const deleteBackup = async (backupFilePath) => {
    if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
    }
};

/**
 * Clean up old backups (older than retention days)
 * @param {Number} retentionDays - Number of days to keep backups
 * @returns {Promise<Number>} Number of backups deleted
 */
export const cleanupOldBackups = async (retentionDays = 7) => {
    const BackupMetadata = mongoose.model('BackupMetadata');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await BackupMetadata.find({
        createdAt: { $lt: cutoffDate }
    });

    let deletedCount = 0;

    for (const backup of oldBackups) {
        try {
            // Delete file
            if (fs.existsSync(backup.filePath)) {
                fs.unlinkSync(backup.filePath);
            }

            // Delete metadata
            await BackupMetadata.deleteOne({ _id: backup._id });
            deletedCount++;
        } catch (error) {
            console.error(`Failed to delete backup ${backup.backupId}:`, error);
        }
    }

    return deletedCount;
};

/**
 * Get backup file path
 * @param {String} backupId - Backup ID
 * @returns {Promise<String>} File path
 */
export const getBackupFilePath = async (backupId) => {
    const BackupMetadata = mongoose.model('BackupMetadata');
    const backup = await BackupMetadata.findOne({ backupId });

    if (!backup) {
        throw new Error('Backup not found');
    }

    if (!fs.existsSync(backup.filePath)) {
        throw new Error('Backup file not found');
    }

    return backup.filePath;
};

/**
 * Import company from ZIP backup (for new user or re-import)
 * @param {String} zipFilePath - Path to uploaded ZIP file
 * @param {String} importingUserId - ID of user importing the company
 * @returns {Promise<Object>} Import result with new company ID and record counts
 */
export const importCompanyFromZip = async (zipFilePath, importingUserId) => {
    const tempDir = path.join(BACKUP_DIR, `import_${Date.now()}`);

    try {
        // Step 1: Extract ZIP
        console.log('Extracting ZIP...');
        await extract(zipFilePath, { dir: tempDir });

        // Step 2: Validate manifest
        const metadataPath = path.join(tempDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            throw new Error('Invalid backup: metadata.json not found');
        }

        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        console.log('Backup metadata:', metadata);

        // Step 3: Validate company.json exists
        const companyPath = path.join(tempDir, 'company.json');
        if (!fs.existsSync(companyPath)) {
            throw new Error('Invalid backup: company.json not found');
        }

        const backupCompanyData = JSON.parse(fs.readFileSync(companyPath, 'utf-8'));

        // Step 4: Validate required sections
        const requiredSections = ['warehouses', 'stockitems', 'clients', 'suppliers'];
        for (const section of requiredSections) {
            const filePath = path.join(tempDir, `${section}.json`);
            if (!fs.existsSync(filePath)) {
                console.warn(`Optional section ${section}.json not found, will skip`);
            }
        }

        // Step 5: Start transaction for atomic import
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Step 6: Create new company with importing user as owner
            const Company = mongoose.model('Company');
            const newCompany = new Company({
                name: backupCompanyData.name,
                ownerId: importingUserId,
                industry: backupCompanyData.industry,
                address: backupCompanyData.address,
                phone: backupCompanyData.phone,
                email: backupCompanyData.email,
                website: backupCompanyData.website,
                taxId: backupCompanyData.taxId,
                logo: backupCompanyData.logo,
                settings: backupCompanyData.settings || {}
            });

            await newCompany.save({ session });
            const newCompanyId = newCompany._id;
            console.log('Created new company:', newCompanyId);

            // Step 7: Initialize ID mapping
            const idMapping = new Map();
            idMapping.set(metadata.companyId.toString(), newCompanyId.toString());

            // Step 8: Define collections to import with their models
            const collections = [
                { collection: 'warehouses', model: 'Warehouse', refs: [] },
                { collection: 'stockitems', model: 'StockItem', refs: ['warehouseId'] },
                { collection: 'clients', model: 'Client', refs: [] },
                { collection: 'suppliers', model: 'Supplier', refs: [] },
                { collection: 'salesorders', model: 'SalesOrder', refs: ['clientId'] },
                { collection: 'purchaseorders', model: 'PurchaseOrder', refs: ['supplierId'] },
                { collection: 'deliveryins', model: 'DeliveryIn', refs: ['supplierId', 'purchaseOrderId'] },
                { collection: 'deliveryouts', model: 'DeliveryOut', refs: ['clientId', 'salesOrderId'] },
                { collection: 'directsales', model: 'DirectSale', refs: ['clientId'] },
                { collection: 'directpurchases', model: 'DirectPurchase', refs: ['supplierId'] },
                { collection: 'payments', model: 'Payment', refs: ['partyId', 'transactionId'] },
                { collection: 'stocktransactions', model: 'StockTransaction', refs: ['warehouseId', 'itemId'] }
            ];

            const importedCounts = {};

            // Step 9: Import each collection with ID remapping
            for (const { collection, model: modelName, refs } of collections) {
                const filePath = path.join(tempDir, `${collection}.json`);

                if (!fs.existsSync(filePath)) {
                    console.log(`Skipping ${collection} - file not found`);
                    importedCounts[collection] = 0;
                    continue;
                }

                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                console.log(`Importing ${data.length} records from ${collection}...`);

                if (data.length === 0) {
                    importedCounts[collection] = 0;
                    continue;
                }

                const model = mongoose.model(modelName);
                const remappedData = [];

                // Remap IDs for each document
                for (const doc of data) {
                    const oldId = doc._id.toString();
                    const newId = new mongoose.Types.ObjectId();
                    idMapping.set(oldId, newId.toString());

                    // Create new document with remapped ID
                    const newDoc = {
                        ...doc,
                        _id: newId,
                        companyId: newCompanyId
                    };

                    // Remap reference fields
                    for (const refField of refs) {
                        if (doc[refField]) {
                            const oldRefId = doc[refField].toString();
                            const newRefId = idMapping.get(oldRefId);
                            if (newRefId) {
                                newDoc[refField] = newRefId;
                            } else {
                                console.warn(`Reference ${refField} not found in mapping for ${collection}`);
                            }
                        }
                    }

                    // Special handling for items array in deliveries
                    if (newDoc.items && Array.isArray(newDoc.items)) {
                        newDoc.items = newDoc.items.map(item => ({
                            ...item,
                            _id: new mongoose.Types.ObjectId(),
                            warehouseId: item.warehouseId ? idMapping.get(item.warehouseId.toString()) || item.warehouseId : item.warehouseId,
                            itemId: item.itemId ? idMapping.get(item.itemId.toString()) || item.itemId : item.itemId
                        }));
                    }

                    remappedData.push(newDoc);
                }

                // Insert remapped data
                await model.insertMany(remappedData, { session });
                importedCounts[collection] = remappedData.length;
                console.log(`Imported ${remappedData.length} ${collection}`);
            }

            // Step 10: Commit transaction
            await session.commitTransaction();
            console.log('Import completed successfully');

            return {
                success: true,
                companyId: newCompanyId,
                companyName: newCompany.name,
                importedCounts,
                metadata: {
                    originalBackupId: metadata.backupId,
                    originalCompanyName: metadata.companyName,
                    backupTimestamp: metadata.timestamp,
                    backupVersion: metadata.version
                }
            };

        } catch (error) {
            // Rollback on error
            await session.abortTransaction();
            console.error('Import failed, transaction rolled back:', error);
            throw error;
        } finally {
            session.endSession();
        }

    } finally {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
};
