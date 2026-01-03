// Script to update backup.js and accounting.js for Direct Mode support
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Updating backend files for Direct Mode support...\n');

// Update backup.js
const backupPath = path.join(__dirname, 'utils', 'backup.js');
let backupContent = fs.readFileSync(backupPath, 'utf-8');

// Add DirectSale and DirectPurchase to backup collections
backupContent = backupContent.replace(
    /{ collection: 'deliveryouts', model: 'DeliveryOut' },\r?\n\s+{ collection: 'payments', model: 'Payment' },/,
    `{ collection: 'deliveryouts', model: 'DeliveryOut' },\r\n            { collection: 'directsales', model: 'DirectSale' },\r\n            { collection: 'directpurchases', model: 'DirectPurchase' },\r\n            { collection: 'payments', model: 'Payment' },`
);

// Add to metadata sections
backupContent = backupContent.replace(
    /'deliveryouts',\r?\n\s+'payments',/,
    `'deliveryouts',\r\n                'directsales',\r\n                'directpurchases',\r\n                'payments',`
);

// Add to restore collections
backupContent = backupContent.replace(
    /{ collection: 'deliveryouts', model: 'DeliveryOut' },\r?\n\s+{ collection: 'payments', model: 'Payment' },\r?\n\s+{ collection: 'stocktransactions', model: 'StockTransaction' },/,
    `{ collection: 'deliveryouts', model: 'DeliveryOut' },\r\n                { collection: 'directsales', model: 'DirectSale' },\r\n                { collection: 'directpurchases', model: 'DirectPurchase' },\r\n                { collection: 'payments', model: 'Payment' },\r\n                { collection: 'stocktransactions', model: 'StockTransaction' },`
);

// Add to import collections
backupContent = backupContent.replace(
    /{ collection: 'deliveryouts', model: 'DeliveryOut', refs: \['clientId', 'salesOrderId'\] },\r?\n\s+{ collection: 'payments', model: 'Payment', refs: \['partyId', 'transactionId'\] },/,
    `{ collection: 'deliveryouts', model: 'DeliveryOut', refs: ['clientId', 'salesOrderId'] },\r\n                { collection: 'directsales', model: 'DirectSale', refs: ['clientId'] },\r\n                { collection: 'directpurchases', model: 'DirectPurchase', refs: ['supplierId'] },\r\n                { collection: 'payments', model: 'Payment', refs: ['partyId', 'transactionId'] },`
);

fs.writeFileSync(backupPath, backupContent);
console.log('✅ Updated backup.js');

// Update accounting.js wages calculator
const accountingPath = path.join(__dirname, 'routes', 'accounting.js');
let accountingContent = fs.readFileSync(accountingPath, 'utf-8');

// Replace the wages calculation logic
const oldWagesLogic = /\/\/ Get company wages per bag\r?\n\s+const company = await Company\.findById\(companyId\);[\s\S]+?totalWages\r?\n\s+}\);/;

const newWagesLogic = `// Get company wages per bag and delivery mode
        const company = await Company.findById(companyId);
        const wagesPerBag = company?.wagesPerBag || 0;
        const deliveryMode = company?.deliveryMode || 'order_based';

        let bagsReceived = 0;
        let bagsDelivered = 0;

        if (deliveryMode === 'direct') {
            // Direct Mode: Use DirectPurchase and DirectSale
            const DirectPurchase = (await import('../models/DirectPurchase.js')).default;
            const DirectSale = (await import('../models/DirectSale.js')).default;

            const directPurchases = await DirectPurchase.find({
                companyId,
                purchaseDate: { $gte: startOfDay, $lte: endOfDay },
                purchaseStatus: 'completed'
            }).lean();

            bagsReceived = directPurchases.reduce((sum, purchase) => {
                return sum + purchase.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);

            const directSales = await DirectSale.find({
                companyId,
                saleDate: { $gte: startOfDay, $lte: endOfDay },
                saleStatus: 'completed'
            }).lean();

            bagsDelivered = directSales.reduce((sum, sale) => {
                return sum + sale.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);
        } else {
            // Order-Based Mode: Use existing DeliveryIn and DeliveryOut
            const deliveriesIn = await DeliveryIn.find({
                companyId,
                receiptDate: { $gte: startOfDay, $lte: endOfDay }
            }).lean();

            bagsReceived = deliveriesIn.reduce((sum, delivery) => {
                return sum + delivery.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);

            const deliveriesOut = await DeliveryOut.find({
                companyId,
                deliveryDate: { $gte: startOfDay, $lte: endOfDay }
            }).lean();

            bagsDelivered = deliveriesOut.reduce((sum, delivery) => {
                return sum + delivery.items.reduce((itemSum, item) => {
                    return itemSum + (item.quantity || 0);
                }, 0);
            }, 0);
        }

        // Get stock moves (common to both modes)
        const stockMoves = await StockTransaction.find({
            companyId,
            type: 'stock_move',
            transactionDate: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const bagsMoved = stockMoves.reduce((sum, move) => {
            return sum + (move.quantity || 0);
        }, 0);

        const totalBags = bagsReceived + bagsMoved + bagsDelivered;
        const totalWages = totalBags * wagesPerBag;

        res.json({
            date,
            deliveryMode,
            bagsReceived,
            bagsMoved,
            bagsDelivered,
            totalBags,
            wagesPerBag,
            totalWages
        });`;

accountingContent = accountingContent.replace(oldWagesLogic, newWagesLogic);

fs.writeFileSync(accountingPath, accountingContent);
console.log('✅ Updated accounting.js wages calculator');

console.log('\n✨ All files updated successfully!');
console.log('Direct Mode support added to:');
console.log('  - Backup/Restore (backup.js)');
console.log('  - Wages Calculator (accounting.js)');
