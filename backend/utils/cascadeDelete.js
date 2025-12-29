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
import Company from '../models/Company.js';
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
            salesOrders: 0,
            purchaseOrders: 0,
            deliveryOuts: 0,
            deliveryIns: 0,
            stockItems: 0,
            clients: 0,
            suppliers: 0,
            warehouses: 0,
            users: 0,
            payments: 0,
            invoices: 0,
            paymentReminders: 0,
            backupMetadata: 0,
            archiveMetadata: 0,
            cleanupLogs: 0,
            ledgerAccounts: 0,
            journalEntries: 0,
            journalLines: 0,
            cashbookBalances: 0
        };

        // Delete in order to avoid foreign key issues
        // 1. Journal Lines (depends on Journal Entries)
        const journalLinesResult = await JournalLine.deleteMany(
            { companyId },
            { session }
        );
        stats.journalLines = journalLinesResult.deletedCount;

        // 2. Journal Entries
        const journalEntriesResult = await JournalEntry.deleteMany(
            { companyId },
            { session }
        );
        stats.journalEntries = journalEntriesResult.deletedCount;

        // 3. Cashbook Balances
        const cashbookBalancesResult = await CashbookBalance.deleteMany(
            { companyId },
            { session }
        );
        stats.cashbookBalances = cashbookBalancesResult.deletedCount;

        // 4. Ledger Accounts
        const ledgerAccountsResult = await LedgerAccount.deleteMany(
            { companyId },
            { session }
        );
        stats.ledgerAccounts = ledgerAccountsResult.deletedCount;

        // 5. Stock Transactions
        const stockTransactionsResult = await StockTransaction.deleteMany(
            { companyId },
            { session }
        );
        stats.stockTransactions = stockTransactionsResult.deletedCount;

        // 6. Sales
        const salesResult = await Sale.deleteMany(
            { companyId },
            { session }
        );
        stats.sales = salesResult.deletedCount;

        // 7. Purchases
        const purchasesResult = await Purchase.deleteMany(
            { companyId },
            { session }
        );
        stats.purchases = purchasesResult.deletedCount;

        // 8. Sales Orders
        const salesOrdersResult = await SalesOrder.deleteMany(
            { companyId },
            { session }
        );
        stats.salesOrders = salesOrdersResult.deletedCount;

        // 9. Purchase Orders
        const purchaseOrdersResult = await PurchaseOrder.deleteMany(
            { companyId },
            { session }
        );
        stats.purchaseOrders = purchaseOrdersResult.deletedCount;

        // 10. Delivery Outs
        const deliveryOutsResult = await DeliveryOut.deleteMany(
            { companyId },
            { session }
        );
        stats.deliveryOuts = deliveryOutsResult.deletedCount;

        // 11. Delivery Ins
        const deliveryInsResult = await DeliveryIn.deleteMany(
            { companyId },
            { session }
        );
        stats.deliveryIns = deliveryInsResult.deletedCount;

        // 12. Payments
        const paymentsResult = await Payment.deleteMany(
            { companyId },
            { session }
        );
        stats.payments = paymentsResult.deletedCount;

        // 13. Invoices
        const invoicesResult = await Invoice.deleteMany(
            { companyId },
            { session }
        );
        stats.invoices = invoicesResult.deletedCount;

        // 14. Payment Reminders
        const paymentRemindersResult = await PaymentReminder.deleteMany(
            { companyId },
            { session }
        );
        stats.paymentReminders = paymentRemindersResult.deletedCount;

        // 15. Stock Items
        const stockItemsResult = await StockItem.deleteMany(
            { companyId },
            { session }
        );
        stats.stockItems = stockItemsResult.deletedCount;

        // 16. Clients
        const clientsResult = await Client.deleteMany(
            { companyId },
            { session }
        );
        stats.clients = clientsResult.deletedCount;

        // 17. Suppliers
        const suppliersResult = await Supplier.deleteMany(
            { companyId },
            { session }
        );
        stats.suppliers = suppliersResult.deletedCount;

        // 18. Warehouses
        const warehousesResult = await Warehouse.deleteMany(
            { companyId },
            { session }
        );
        stats.warehouses = warehousesResult.deletedCount;

        // 19. Backup Metadata (IMPORTANT: Delete archived data)
        const backupMetadataResult = await BackupMetadata.deleteMany(
            { companyId },
            { session }
        );
        stats.backupMetadata = backupMetadataResult.deletedCount;

        // 20. Archive Metadata (IMPORTANT: Delete archived data)
        const archiveMetadataResult = await ArchiveMetadata.deleteMany(
            { companyId },
            { session }
        );
        stats.archiveMetadata = archiveMetadataResult.deletedCount;

        // 21. Cleanup Logs
        const cleanupLogsResult = await CleanupLog.deleteMany(
            { companyId },
            { session }
        );
        stats.cleanupLogs = cleanupLogsResult.deletedCount;

        // 22. Users (except owner - owner will be deleted with company)
        const usersResult = await User.deleteMany(
            { companyId, role: { $ne: 'owner' } },
            { session }
        );
        stats.users = usersResult.deletedCount;

        // 23. Company itself
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
        salesOrdersCount,
        purchaseOrdersCount,
        deliveryOutsCount,
        deliveryInsCount,
        stockItemsCount,
        clientsCount,
        suppliersCount,
        warehousesCount,
        usersCount
    ] = await Promise.all([
        StockTransaction.countDocuments({ companyId }),
        Sale.countDocuments({ companyId }),
        Purchase.countDocuments({ companyId }),
        SalesOrder.countDocuments({ companyId }),
        PurchaseOrder.countDocuments({ companyId }),
        DeliveryOut.countDocuments({ companyId }),
        DeliveryIn.countDocuments({ companyId }),
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
        salesOrders: salesOrdersCount,
        purchaseOrders: purchaseOrdersCount,
        deliveryOuts: deliveryOutsCount,
        deliveryIns: deliveryInsCount,
        stockItems: stockItemsCount,
        clients: clientsCount,
        suppliers: suppliersCount,
        warehouses: warehousesCount,
        users: usersCount,
        total: stockTransactionsCount + salesCount + purchasesCount +
            salesOrdersCount + purchaseOrdersCount + deliveryOutsCount + deliveryInsCount +
            stockItemsCount + clientsCount + suppliersCount +
            warehousesCount + usersCount
    };
};
