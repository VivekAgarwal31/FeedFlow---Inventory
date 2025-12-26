import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sale from './models/Sale.js';
import Purchase from './models/Purchase.js';
import Client from './models/Client.js';
import Supplier from './models/Supplier.js';

dotenv.config();

/**
 * Migration script to add payment tracking fields to existing sales and purchases
 * This ensures backward compatibility with existing data
 */

async function migratePaymentTracking() {
    try {
        console.log('🔄 Starting payment tracking migration...');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Migrate Sales
        console.log('\n📊 Migrating Sales...');
        const sales = await Sale.find({});
        let salesUpdated = 0;

        for (const sale of sales) {
            let needsUpdate = false;

            // Set default values for new fields if not present
            if (sale.amountPaid === undefined) {
                sale.amountPaid = sale.paymentStatus === 'paid' ? sale.totalAmount : 0;
                needsUpdate = true;
            }

            if (sale.amountDue === undefined) {
                sale.amountDue = sale.totalAmount - (sale.amountPaid || 0);
                needsUpdate = true;
            }

            if (!sale.paymentHistory) {
                sale.paymentHistory = [];
                needsUpdate = true;
            }

            if (sale.isOverdue === undefined) {
                sale.isOverdue = false;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await sale.save();
                salesUpdated++;
            }
        }

        console.log(`✅ Updated ${salesUpdated} sales`);

        // Migrate Purchases
        console.log('\n📦 Migrating Purchases...');
        const purchases = await Purchase.find({});
        let purchasesUpdated = 0;

        for (const purchase of purchases) {
            let needsUpdate = false;

            if (purchase.amountPaid === undefined) {
                purchase.amountPaid = purchase.paymentStatus === 'paid' ? purchase.totalAmount : 0;
                needsUpdate = true;
            }

            if (purchase.amountDue === undefined) {
                purchase.amountDue = purchase.totalAmount - (purchase.amountPaid || 0);
                needsUpdate = true;
            }

            if (!purchase.paymentHistory) {
                purchase.paymentHistory = [];
                needsUpdate = true;
            }

            if (purchase.isOverdue === undefined) {
                purchase.isOverdue = false;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await purchase.save();
                purchasesUpdated++;
            }
        }

        console.log(`✅ Updated ${purchasesUpdated} purchases`);

        // Update Client credit balances
        console.log('\n👥 Updating Client credit balances...');
        const clients = await Client.find({});
        let clientsUpdated = 0;

        for (const client of clients) {
            // Calculate current credit from unpaid sales
            const unpaidSales = await Sale.find({
                clientId: client._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const currentCredit = unpaidSales.reduce((sum, sale) => sum + (sale.amountDue || 0), 0);
            const overdueAmount = unpaidSales
                .filter(sale => sale.isOverdue)
                .reduce((sum, sale) => sum + (sale.amountDue || 0), 0);

            if (client.currentCredit !== currentCredit || client.overdueAmount !== overdueAmount) {
                client.currentCredit = currentCredit;
                client.overdueAmount = overdueAmount;
                client.updateCreditStatus();
                await client.save();
                clientsUpdated++;
            }
        }

        console.log(`✅ Updated ${clientsUpdated} clients`);

        // Update Supplier payables
        console.log('\n🏭 Updating Supplier payables...');
        const suppliers = await Supplier.find({});
        let suppliersUpdated = 0;

        for (const supplier of suppliers) {
            // Calculate current payable from unpaid purchases
            const unpaidPurchases = await Purchase.find({
                supplierId: supplier._id,
                paymentStatus: { $in: ['pending', 'partial'] }
            });

            const currentPayable = unpaidPurchases.reduce((sum, purchase) => sum + (purchase.amountDue || 0), 0);
            const overduePayable = unpaidPurchases
                .filter(purchase => purchase.isOverdue)
                .reduce((sum, purchase) => sum + (purchase.amountDue || 0), 0);

            if (supplier.currentPayable !== currentPayable || supplier.overduePayable !== overduePayable) {
                supplier.currentPayable = currentPayable;
                supplier.overduePayable = overduePayable;
                await supplier.save();
                suppliersUpdated++;
            }
        }

        console.log(`✅ Updated ${suppliersUpdated} suppliers`);

        console.log('\n✅ Migration completed successfully!');
        console.log(`\nSummary:`);
        console.log(`  - Sales updated: ${salesUpdated}`);
        console.log(`  - Purchases updated: ${purchasesUpdated}`);
        console.log(`  - Clients updated: ${clientsUpdated}`);
        console.log(`  - Suppliers updated: ${suppliersUpdated}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migratePaymentTracking();
