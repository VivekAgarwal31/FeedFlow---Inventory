import StockTransaction from '../models/StockTransaction.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import StockItem from '../models/StockItem.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Warehouse from '../models/Warehouse.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import mongoose from 'mongoose';

/**
 * Delete all data associated with a company
 * Uses MongoDB transactions to ensure atomicity
 * @param {String} companyId - The company ID to delete
 * @returns {Object} Deletion statistics
 */
export const deleteCompanyData = async (companyId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const stats = {
            stockTransactions: 0,
            sales: 0,
            purchases: 0,
            stockItems: 0,
            clients: 0,
            suppliers: 0,
            warehouses: 0,
            users: 0
        };

        // Delete in order to avoid foreign key issues
        // 1. Stock Transactions
        const stockTransactionsResult = await StockTransaction.deleteMany(
            { companyId },
            { session }
        );
        stats.stockTransactions = stockTransactionsResult.deletedCount;

        // 2. Sales
        const salesResult = await Sale.deleteMany(
            { companyId },
            { session }
        );
        stats.sales = salesResult.deletedCount;

        // 3. Purchases
        const purchasesResult = await Purchase.deleteMany(
            { companyId },
            { session }
        );
        stats.purchases = purchasesResult.deletedCount;

        // 4. Stock Items
        const stockItemsResult = await StockItem.deleteMany(
            { companyId },
            { session }
        );
        stats.stockItems = stockItemsResult.deletedCount;

        // 5. Clients
        const clientsResult = await Client.deleteMany(
            { companyId },
            { session }
        );
        stats.clients = clientsResult.deletedCount;

        // 6. Suppliers
        const suppliersResult = await Supplier.deleteMany(
            { companyId },
            { session }
        );
        stats.suppliers = suppliersResult.deletedCount;

        // 7. Warehouses
        const warehousesResult = await Warehouse.deleteMany(
            { companyId },
            { session }
        );
        stats.warehouses = warehousesResult.deletedCount;

        // 8. Users (except owner - owner will be deleted with company)
        const usersResult = await User.deleteMany(
            { companyId, role: { $ne: 'owner' } },
            { session }
        );
        stats.users = usersResult.deletedCount;

        // 9. Company itself
        await Company.findByIdAndDelete(companyId, { session });

        // Commit transaction
        await session.commitTransaction();

        return stats;
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get company data statistics
 * @param {String} companyId - The company ID
 * @returns {Object} Data statistics
 */
export const getCompanyDataStats = async (companyId) => {
    const [
        stockTransactionsCount,
        salesCount,
        purchasesCount,
        stockItemsCount,
        clientsCount,
        suppliersCount,
        warehousesCount,
        usersCount
    ] = await Promise.all([
        StockTransaction.countDocuments({ companyId }),
        Sale.countDocuments({ companyId }),
        Purchase.countDocuments({ companyId }),
        StockItem.countDocuments({ companyId }),
        Client.countDocuments({ companyId }),
        Supplier.countDocuments({ companyId }),
        Warehouse.countDocuments({ companyId }),
        User.countDocuments({ companyId })
    ]);

    return {
        stockTransactions: stockTransactionsCount,
        sales: salesCount,
        purchases: purchasesCount,
        stockItems: stockItemsCount,
        clients: clientsCount,
        suppliers: suppliersCount,
        warehouses: warehousesCount,
        users: usersCount,
        total: stockTransactionsCount + salesCount + purchasesCount +
            stockItemsCount + clientsCount + suppliersCount +
            warehousesCount + usersCount
    };
};
