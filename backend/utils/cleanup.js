import mongoose from 'mongoose';

/**
 * Analyze orphaned records (records with broken references)
 * @param {String} companyId - Company ID
 * @returns {Promise<Object>} Analysis report
 */
export const analyzeOrphanedRecords = async (companyId) => {
    const report = {
        orphanedStockItems: [],
        orphanedSales: [],
        orphanedPurchases: [],
        orphanedTransactions: []
    };

    // Find stock items with invalid warehouse references
    const StockItem = mongoose.model('StockItem');
    const Warehouse = mongoose.model('Warehouse');

    const stockItems = await StockItem.find({ companyId }).lean();
    const warehouseIds = new Set(
        (await Warehouse.find({ companyId }).select('_id').lean()).map(w => w._id.toString())
    );

    report.orphanedStockItems = stockItems.filter(item =>
        !warehouseIds.has(item.warehouseId.toString())
    ).map(item => ({
        _id: item._id,
        itemName: item.itemName,
        warehouseId: item.warehouseId
    }));

    // Find sales with invalid client references
    const Sale = mongoose.model('Sale');
    const Client = mongoose.model('Client');

    const sales = await Sale.find({ companyId, clientId: { $exists: true } }).lean();
    const clientIds = new Set(
        (await Client.find({ companyId }).select('_id').lean()).map(c => c._id.toString())
    );

    report.orphanedSales = sales.filter(sale =>
        sale.clientId && !clientIds.has(sale.clientId.toString())
    ).map(sale => ({
        _id: sale._id,
        clientName: sale.clientName,
        clientId: sale.clientId,
        totalAmount: sale.totalAmount
    }));

    // Find purchases with invalid supplier references
    const Purchase = mongoose.model('Purchase');
    const Supplier = mongoose.model('Supplier');

    const purchases = await Purchase.find({ companyId }).lean();
    const supplierIds = new Set(
        (await Supplier.find({ companyId }).select('_id').lean()).map(s => s._id.toString())
    );

    report.orphanedPurchases = purchases.filter(purchase =>
        !supplierIds.has(purchase.supplierId.toString())
    ).map(purchase => ({
        _id: purchase._id,
        supplierName: purchase.supplierName,
        supplierId: purchase.supplierId,
        totalAmount: purchase.totalAmount
    }));

    // Find transactions with invalid item/warehouse references
    const StockTransaction = mongoose.model('StockTransaction');
    const transactions = await StockTransaction.find({ companyId }).lean();
    const stockItemIds = new Set(stockItems.map(item => item._id.toString()));

    report.orphanedTransactions = transactions.filter(txn =>
        !stockItemIds.has(txn.itemId.toString()) ||
        !warehouseIds.has(txn.warehouseId.toString())
    ).map(txn => ({
        _id: txn._id,
        type: txn.type,
        itemName: txn.itemName,
        itemId: txn.itemId,
        warehouseId: txn.warehouseId
    }));

    return {
        summary: {
            totalOrphaned:
                report.orphanedStockItems.length +
                report.orphanedSales.length +
                report.orphanedPurchases.length +
                report.orphanedTransactions.length
        },
        details: report
    };
};

/**
 * Find duplicate records
 * @param {String} companyId - Company ID
 * @param {String} entityType - Type of entity to check
 * @returns {Promise<Array>} List of duplicates
 */
export const findDuplicates = async (companyId, entityType) => {
    const modelMap = {
        clients: { model: 'Client', field: 'name' },
        suppliers: { model: 'Supplier', field: 'name' },
        warehouses: { model: 'Warehouse', field: 'name' }
    };

    const config = modelMap[entityType];
    if (!config) {
        throw new Error(`Duplicate detection not supported for: ${entityType}`);
    }

    const Model = mongoose.model(config.model);

    const duplicates = await Model.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
            $group: {
                _id: `$${config.field}`,
                count: { $sum: 1 },
                ids: { $push: '$_id' }
            }
        },
        { $match: { count: { $gt: 1 } } }
    ]);

    return duplicates.map(dup => ({
        name: dup._id,
        count: dup.count,
        ids: dup.ids
    }));
};

/**
 * Clean up orphaned records
 * @param {String} companyId - Company ID
 * @param {Boolean} dryRun - If true, only report what would be deleted
 * @param {String} userId - User performing cleanup
 * @returns {Promise<Object>} Cleanup result
 */
export const cleanupOrphans = async (companyId, dryRun = true, userId) => {
    const analysis = await analyzeOrphanedRecords(companyId);

    if (dryRun) {
        return {
            dryRun: true,
            wouldDelete: analysis.summary.totalOrphaned,
            details: analysis.details
        };
    }

    const CleanupLog = mongoose.model('CleanupLog');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let totalDeleted = 0;
        const deletedDetails = {};

        // Delete orphaned stock items
        if (analysis.details.orphanedStockItems.length > 0) {
            const StockItem = mongoose.model('StockItem');
            const result = await StockItem.deleteMany({
                _id: { $in: analysis.details.orphanedStockItems.map(item => item._id) }
            }, { session });
            deletedDetails.stockItems = result.deletedCount;
            totalDeleted += result.deletedCount;
        }

        // Delete orphaned sales
        if (analysis.details.orphanedSales.length > 0) {
            const Sale = mongoose.model('Sale');
            const result = await Sale.deleteMany({
                _id: { $in: analysis.details.orphanedSales.map(sale => sale._id) }
            }, { session });
            deletedDetails.sales = result.deletedCount;
            totalDeleted += result.deletedCount;
        }

        // Delete orphaned purchases
        if (analysis.details.orphanedPurchases.length > 0) {
            const Purchase = mongoose.model('Purchase');
            const result = await Purchase.deleteMany({
                _id: { $in: analysis.details.orphanedPurchases.map(purchase => purchase._id) }
            }, { session });
            deletedDetails.purchases = result.deletedCount;
            totalDeleted += result.deletedCount;
        }

        // Delete orphaned transactions
        if (analysis.details.orphanedTransactions.length > 0) {
            const StockTransaction = mongoose.model('StockTransaction');
            const result = await StockTransaction.deleteMany({
                _id: { $in: analysis.details.orphanedTransactions.map(txn => txn._id) }
            }, { session });
            deletedDetails.transactions = result.deletedCount;
            totalDeleted += result.deletedCount;
        }

        // Log cleanup
        await CleanupLog.create([{
            companyId,
            cleanupType: 'orphans',
            recordsAffected: totalDeleted,
            details: deletedDetails,
            executedBy: userId
        }], { session });

        await session.commitTransaction();

        return {
            success: true,
            deleted: totalDeleted,
            details: deletedDetails
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Optimize database (rebuild indexes, analyze stats)
 * @param {String} companyId - Company ID
 * @returns {Promise<Object>} Optimization result
 */
export const optimizeDatabase = async (companyId) => {
    const collections = [
        'stockitems',
        'sales',
        'purchases',
        'stocktransactions',
        'clients',
        'suppliers',
        'warehouses'
    ];

    const results = {};

    for (const collectionName of collections) {
        try {
            const collection = mongoose.connection.db.collection(collectionName);

            // Rebuild indexes
            await collection.reIndex();

            // Get collection stats
            const stats = await collection.stats();

            results[collectionName] = {
                success: true,
                documentCount: stats.count,
                storageSize: stats.storageSize,
                indexCount: stats.nindexes
            };
        } catch (error) {
            results[collectionName] = {
                success: false,
                error: error.message
            };
        }
    }

    return results;
};

/**
 * Get cleanup history
 * @param {String} companyId - Company ID
 * @param {Number} limit - Number of records to return
 * @returns {Promise<Array>} Cleanup history
 */
export const getCleanupHistory = async (companyId, limit = 20) => {
    const CleanupLog = mongoose.model('CleanupLog');

    return await CleanupLog.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('executedBy', 'fullName email')
        .lean();
};
