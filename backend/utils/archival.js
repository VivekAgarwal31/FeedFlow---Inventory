import mongoose from 'mongoose';

/**
 * Archive old records based on date criteria
 * @param {String} companyId - Company ID
 * @param {String} entityType - Type of entity to archive
 * @param {Date} cutoffDate - Records older than this date will be archived
 * @param {String} userId - User performing the archive
 * @returns {Promise<Object>} Archive result
 */
export const archiveOldRecords = async (companyId, entityType, cutoffDate, userId) => {
    const modelMap = {
        stockTransactions: 'StockTransaction',
        salesOrders: 'SalesOrder',
        purchaseOrders: 'PurchaseOrder',
        // Backward compatibility
        sales: 'SalesOrder',
        purchases: 'PurchaseOrder'
    };

    const modelName = modelMap[entityType];
    if (!modelName) {
        throw new Error(`Unsupported entity type for archival: ${entityType}`);
    }

    const Model = mongoose.model(modelName);
    const ArchiveMetadata = mongoose.model('ArchiveMetadata');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Determine date field based on entity type
        const dateField = entityType === 'stockTransactions' ? 'transactionDate' :
            (entityType === 'salesOrders' || entityType === 'sales') ? 'orderDate' :
                (entityType === 'purchaseOrders' || entityType === 'purchases') ? 'orderDate' : 'createdAt';

        // Find records to archive
        const recordsToArchive = await Model.find({
            companyId,
            [dateField]: { $lt: cutoffDate }
        }).session(session);

        if (recordsToArchive.length === 0) {
            await session.abortTransaction();
            return {
                success: true,
                recordCount: 0,
                message: 'No records found to archive'
            };
        }

        // Create archive collection name
        const archiveCollectionName = `${entityType}_archive`;

        // Get or create archive collection
        const db = mongoose.connection.db;
        const archiveCollection = db.collection(archiveCollectionName);

        // Insert records into archive
        const archiveRecords = recordsToArchive.map(record => ({
            ...record.toObject(),
            archivedAt: new Date(),
            archivedBy: userId
        }));

        await archiveCollection.insertMany(archiveRecords, { session });

        // Delete from main collection
        await Model.deleteMany({
            _id: { $in: recordsToArchive.map(r => r._id) }
        }, { session });

        // Create archive metadata
        await ArchiveMetadata.create([{
            companyId,
            entityType,
            recordCount: recordsToArchive.length,
            cutoffDate,
            archivedBy: userId
        }], { session });

        await session.commitTransaction();

        return {
            success: true,
            recordCount: recordsToArchive.length,
            cutoffDate
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get archived records
 * @param {String} companyId - Company ID
 * @param {String} entityType - Type of entity
 * @param {Object} filters - Additional filters
 * @param {Number} page - Page number
 * @param {Number} limit - Records per page
 * @returns {Promise<Object>} Archived records with pagination
 */
export const getArchivedRecords = async (companyId, entityType, filters = {}, page = 1, limit = 50) => {
    const archiveCollectionName = `${entityType}_archive`;
    const db = mongoose.connection.db;
    const archiveCollection = db.collection(archiveCollectionName);

    const query = {
        companyId: new mongoose.Types.ObjectId(companyId),
        ...filters
    };

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
        archiveCollection.find(query).skip(skip).limit(limit).toArray(),
        archiveCollection.countDocuments(query)
    ]);

    return {
        records,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Restore records from archive
 * @param {String} companyId - Company ID
 * @param {String} entityType - Type of entity
 * @param {Array} recordIds - IDs of records to restore
 * @returns {Promise<Object>} Restore result
 */
export const restoreFromArchive = async (companyId, entityType, recordIds) => {
    const modelMap = {
        stockTransactions: 'StockTransaction',
        salesOrders: 'SalesOrder',
        purchaseOrders: 'PurchaseOrder',
        // Backward compatibility
        sales: 'SalesOrder',
        purchases: 'PurchaseOrder'
    };

    const modelName = modelMap[entityType];
    if (!modelName) {
        throw new Error(`Unsupported entity type for restore: ${entityType}`);
    }

    const Model = mongoose.model(modelName);
    const archiveCollectionName = `${entityType}_archive`;
    const db = mongoose.connection.db;
    const archiveCollection = db.collection(archiveCollectionName);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find records in archive
        const archivedRecords = await archiveCollection.find({
            _id: { $in: recordIds.map(id => new mongoose.Types.ObjectId(id)) },
            companyId: new mongoose.Types.ObjectId(companyId)
        }).toArray();

        if (archivedRecords.length === 0) {
            await session.abortTransaction();
            return {
                success: false,
                message: 'No records found in archive'
            };
        }

        // Remove archive metadata
        const recordsToRestore = archivedRecords.map(record => {
            const { archivedAt, archivedBy, ...originalRecord } = record;
            return originalRecord;
        });

        // Insert back into main collection
        await Model.insertMany(recordsToRestore, { session });

        // Delete from archive
        await archiveCollection.deleteMany({
            _id: { $in: recordIds.map(id => new mongoose.Types.ObjectId(id)) }
        }, { session });

        await session.commitTransaction();

        return {
            success: true,
            recordCount: archivedRecords.length
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get archive statistics
 * @param {String} companyId - Company ID
 * @returns {Promise<Object>} Archive statistics
 */
export const getArchiveStats = async (companyId) => {
    const ArchiveMetadata = mongoose.model('ArchiveMetadata');

    const stats = await ArchiveMetadata.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
            $group: {
                _id: '$entityType',
                totalArchived: { $sum: '$recordCount' },
                lastArchived: { $max: '$createdAt' }
            }
        }
    ]);

    return stats.reduce((acc, stat) => {
        acc[stat._id] = {
            totalArchived: stat.totalArchived,
            lastArchived: stat.lastArchived
        };
        return acc;
    }, {});
};
