import mongoose from 'mongoose';
import Company from '../models/Company.js';
import StockTransaction from '../models/StockTransaction.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryOut from '../models/DeliveryOut.js';
import DeliveryIn from '../models/DeliveryIn.js';
import StockItem from '../models/StockItem.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Warehouse from '../models/Warehouse.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import PaymentReminder from '../models/PaymentReminder.js';
import BackupMetadata from '../models/BackupMetadata.js';
import ArchiveMetadata from '../models/ArchiveMetadata.js';
import CleanupLog from '../models/CleanupLog.js';
import LedgerAccount from '../models/LedgerAccount.js';
import JournalEntry from '../models/JournalEntry.js';
import JournalLine from '../models/JournalLine.js';
import CashbookBalance from '../models/CashbookBalance.js';

/**
 * Delete all orphaned data (data not belonging to any active company)
 * This is useful for cleaning up MongoDB storage
 */
export async function deleteOrphanedData() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get all active company IDs
        const activeCompanies = await Company.find({}).select('_id').lean();
        const activeCompanyIds = activeCompanies.map(c => c._id);

        const stats = {
            journalLines: 0,
            journalEntries: 0,
            cashbookBalances: 0,
            ledgerAccounts: 0,
            stockTransactions: 0,
            sales: 0,
            purchases: 0,
            salesOrders: 0,
            purchaseOrders: 0,
            deliveryOuts: 0,
            deliveryIns: 0,
            payments: 0,
            invoices: 0,
            paymentReminders: 0,
            stockItems: 0,
            clients: 0,
            suppliers: 0,
            warehouses: 0,
            backupMetadata: 0,
            archiveMetadata: 0,
            cleanupLogs: 0,
            users: 0
        };

        // Delete all data where companyId is NOT in activeCompanyIds
        const orphanQuery = { companyId: { $nin: activeCompanyIds } };

        // Delete in order
        const journalLinesResult = await JournalLine.deleteMany(orphanQuery, { session });
        stats.journalLines = journalLinesResult.deletedCount;

        const journalEntriesResult = await JournalEntry.deleteMany(orphanQuery, { session });
        stats.journalEntries = journalEntriesResult.deletedCount;

        const cashbookBalancesResult = await CashbookBalance.deleteMany(orphanQuery, { session });
        stats.cashbookBalances = cashbookBalancesResult.deletedCount;

        const ledgerAccountsResult = await LedgerAccount.deleteMany(orphanQuery, { session });
        stats.ledgerAccounts = ledgerAccountsResult.deletedCount;

        const stockTransactionsResult = await StockTransaction.deleteMany(orphanQuery, { session });
        stats.stockTransactions = stockTransactionsResult.deletedCount;

        const salesResult = await Sale.deleteMany(orphanQuery, { session });
        stats.sales = salesResult.deletedCount;

        const purchasesResult = await Purchase.deleteMany(orphanQuery, { session });
        stats.purchases = purchasesResult.deletedCount;

        const salesOrdersResult = await SalesOrder.deleteMany(orphanQuery, { session });
        stats.salesOrders = salesOrdersResult.deletedCount;

        const purchaseOrdersResult = await PurchaseOrder.deleteMany(orphanQuery, { session });
        stats.purchaseOrders = purchaseOrdersResult.deletedCount;

        const deliveryOutsResult = await DeliveryOut.deleteMany(orphanQuery, { session });
        stats.deliveryOuts = deliveryOutsResult.deletedCount;

        const deliveryInsResult = await DeliveryIn.deleteMany(orphanQuery, { session });
        stats.deliveryIns = deliveryInsResult.deletedCount;

        const paymentsResult = await Payment.deleteMany(orphanQuery, { session });
        stats.payments = paymentsResult.deletedCount;

        const invoicesResult = await Invoice.deleteMany(orphanQuery, { session });
        stats.invoices = invoicesResult.deletedCount;

        const paymentRemindersResult = await PaymentReminder.deleteMany(orphanQuery, { session });
        stats.paymentReminders = paymentRemindersResult.deletedCount;

        const stockItemsResult = await StockItem.deleteMany(orphanQuery, { session });
        stats.stockItems = stockItemsResult.deletedCount;

        const clientsResult = await Client.deleteMany(orphanQuery, { session });
        stats.clients = clientsResult.deletedCount;

        const suppliersResult = await Supplier.deleteMany(orphanQuery, { session });
        stats.suppliers = suppliersResult.deletedCount;

        const warehousesResult = await Warehouse.deleteMany(orphanQuery, { session });
        stats.warehouses = warehousesResult.deletedCount;

        const backupMetadataResult = await BackupMetadata.deleteMany(orphanQuery, { session });
        stats.backupMetadata = backupMetadataResult.deletedCount;

        const archiveMetadataResult = await ArchiveMetadata.deleteMany(orphanQuery, { session });
        stats.archiveMetadata = archiveMetadataResult.deletedCount;

        const cleanupLogsResult = await CleanupLog.deleteMany(orphanQuery, { session });
        stats.cleanupLogs = cleanupLogsResult.deletedCount;

        // Delete orphaned users (users whose companyId doesn't exist)
        const usersResult = await User.deleteMany(orphanQuery, { session });
        stats.users = usersResult.deletedCount;

        // Commit transaction
        await session.commitTransaction();

        return {
            success: true,
            stats,
            totalDeleted: Object.values(stats).reduce((sum, count) => sum + count, 0)
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Get statistics of orphaned data
 */
export async function getOrphanedDataStats() {
    // Get all active company IDs
    const activeCompanies = await Company.find({}).select('_id').lean();
    const activeCompanyIds = activeCompanies.map(c => c._id);

    const orphanQuery = { companyId: { $nin: activeCompanyIds } };

    const [
        journalLines,
        journalEntries,
        cashbookBalances,
        ledgerAccounts,
        stockTransactions,
        sales,
        purchases,
        salesOrders,
        purchaseOrders,
        deliveryOuts,
        deliveryIns,
        payments,
        invoices,
        paymentReminders,
        stockItems,
        clients,
        suppliers,
        warehouses,
        backupMetadata,
        archiveMetadata,
        cleanupLogs,
        users
    ] = await Promise.all([
        JournalLine.countDocuments(orphanQuery),
        JournalEntry.countDocuments(orphanQuery),
        CashbookBalance.countDocuments(orphanQuery),
        LedgerAccount.countDocuments(orphanQuery),
        StockTransaction.countDocuments(orphanQuery),
        Sale.countDocuments(orphanQuery),
        Purchase.countDocuments(orphanQuery),
        SalesOrder.countDocuments(orphanQuery),
        PurchaseOrder.countDocuments(orphanQuery),
        DeliveryOut.countDocuments(orphanQuery),
        DeliveryIn.countDocuments(orphanQuery),
        Payment.countDocuments(orphanQuery),
        Invoice.countDocuments(orphanQuery),
        PaymentReminder.countDocuments(orphanQuery),
        StockItem.countDocuments(orphanQuery),
        Client.countDocuments(orphanQuery),
        Supplier.countDocuments(orphanQuery),
        Warehouse.countDocuments(orphanQuery),
        BackupMetadata.countDocuments(orphanQuery),
        ArchiveMetadata.countDocuments(orphanQuery),
        CleanupLog.countDocuments(orphanQuery),
        User.countDocuments(orphanQuery)
    ]);

    const stats = {
        journalLines,
        journalEntries,
        cashbookBalances,
        ledgerAccounts,
        stockTransactions,
        sales,
        purchases,
        salesOrders,
        purchaseOrders,
        deliveryOuts,
        deliveryIns,
        payments,
        invoices,
        paymentReminders,
        stockItems,
        clients,
        suppliers,
        warehouses,
        backupMetadata,
        archiveMetadata,
        cleanupLogs,
        users
    };

    return {
        stats,
        totalOrphaned: Object.values(stats).reduce((sum, count) => sum + count, 0)
    };
}
