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
            { collection: 'sales', model: 'Sale' },
            { collection: 'purchases', model: 'Purchase' },
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

        // Create metadata file
        const metadata = {
            backupId,
            companyId,
            companyName,
            timestamp: new Date().toISOString(),
            recordCounts,
            version: '1.0'
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
                { collection: 'sales', model: 'Sale' },
                { collection: 'purchases', model: 'Purchase' },
                { collection: 'stocktransactions', model: 'StockTransaction' }
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
