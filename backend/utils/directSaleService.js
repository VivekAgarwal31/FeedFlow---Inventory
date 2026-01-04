import mongoose from 'mongoose';
import StockItem from '../models/StockItem.js';
import Client from '../models/Client.js';
import DirectSale from '../models/DirectSale.js';
import StockTransaction from '../models/StockTransaction.js';
import { createJournalEntry, initializeDefaultAccounts } from './journalEntry.js';

/**
 * Create a direct sale transaction
 * This decreases inventory and creates a receivable for the client
 * @param {Object} saleData - Sale data
 * @param {String} userId - User performing the action
 * @returns {Promise<Object>} Created sale and transaction details
 */
export const createDirectSale = async (saleData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { companyId, clientId, items, notes, staffName, paymentType, paymentMethod } = saleData;

        console.log('=== DIRECT SALE SERVICE DEBUG ===');
        console.log('Received paymentType:', paymentType);
        console.log('Received paymentMethod:', paymentMethod);
        console.log('Full saleData:', JSON.stringify(saleData, null, 2));

        // 1. Validate client exists
        const client = await Client.findOne({ _id: clientId, companyId }).session(session);
        if (!client) {
            throw new Error('Client not found');
        }

        // 2. Validate stock availability and calculate totals
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            const stockItem = await StockItem.findOne({
                itemName: item.itemName,
                companyId,
                warehouseId: item.warehouseId
            }).session(session);

            if (!stockItem) {
                throw new Error(`Stock item not found: ${item.itemName} in ${item.warehouseName}`);
            }

            // Allow negative stock - no validation check
            // Stock will go negative if quantity exceeds available

            const lineTotal = item.quantity * item.sellingPrice;
            totalAmount += lineTotal;

            validatedItems.push({
                itemId: stockItem._id,  // Use the actual stock item ID from DB
                itemName: stockItem.itemName,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName,
                quantity: item.quantity,
                sellingPrice: item.sellingPrice,
                total: lineTotal
            });
        }

        // 3. Generate sale number
        const lastSale = await DirectSale.findOne({ companyId })
            .sort({ saleNumber: -1 })
            .session(session);
        const saleNumber = lastSale ? lastSale.saleNumber + 1 : 1;

        // 4. Create direct sale record
        const directSale = new DirectSale({
            companyId,
            saleNumber,
            clientId,
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email,
            items: validatedItems,
            totalAmount,
            paymentType: paymentType || 'cash',
            paymentMethod: paymentMethod || 'cash',
            saleDate: new Date(),
            saleStatus: 'completed',
            notes,
            staffName,
            performedBy: userId
        });

        await directSale.save({ session });

        console.log('=== AFTER SAVE ===');
        console.log('Saved paymentType:', directSale.paymentType);
        console.log('Saved paymentStatus:', directSale.paymentStatus);
        console.log('Saved amountPaid:', directSale.amountPaid);

        // 5. Decrease inventory
        for (const item of validatedItems) {
            await StockItem.findOneAndUpdate(
                { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                { $inc: { quantity: -item.quantity } },
                { session }
            );
        }

        // 6. Update client totals (receivable only for credit sales)
        const clientUpdate = {
            $inc: {
                totalPurchases: totalAmount
            },
            lastPurchaseDate: new Date()
        };

        // Only add to receivable if it's a credit sale
        // Update BOTH currentCredit (for order-based system) and totalReceivable (for direct sales)
        if (paymentType === 'credit') {
            clientUpdate.$inc.currentCredit = totalAmount;
            clientUpdate.$inc.totalReceivable = totalAmount;
        }

        console.log('=== CLIENT UPDATE DEBUG ===');
        console.log('Client ID:', clientId);
        console.log('Total Amount:', totalAmount);
        console.log('Payment Type:', paymentType);
        console.log('Client Update Object:', JSON.stringify(clientUpdate, null, 2));

        const updatedClient = await Client.findByIdAndUpdate(clientId, clientUpdate, { session, new: true });

        console.log('=== AFTER CLIENT UPDATE ===');
        console.log('Updated totalPurchases:', updatedClient?.totalPurchases);
        console.log('Updated currentCredit:', updatedClient?.currentCredit);
        console.log('Updated totalReceivable:', updatedClient?.totalReceivable);

        // 7. Create single stock transaction record with all items
        const stockTransaction = new StockTransaction({
            companyId,
            type: 'direct_sale',
            items: validatedItems.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName
            })),
            referenceId: directSale._id,
            referenceModel: 'DirectSale',
            notes: `Direct Sale #${saleNumber} to ${client.name}`,
            staffName,
            transactionDate: new Date(),
            performedBy: userId,
            quantity: validatedItems.reduce((sum, item) => sum + item.quantity, 0)  // Total quantity
        });

        await stockTransaction.save({ session });

        // 8. Create journal entry (accounting) - different for cash vs credit
        try {
            const journalLines = paymentType === 'cash' ? [
                {
                    accountCode: 'CASH',  // Cash (Debit)
                    debit: totalAmount,
                    credit: 0,
                    description: `Cash sale to ${client.name}`
                },
                {
                    accountCode: 'SALES',  // Sales Revenue (Credit)
                    debit: 0,
                    credit: totalAmount,
                    description: `Sale to ${client.name}`
                }
            ] : [
                {
                    accountCode: 'AR',  // Accounts Receivable (Debit)
                    debit: totalAmount,
                    credit: 0,
                    description: `Receivable from ${client.name}`
                },
                {
                    accountCode: 'SALES',  // Sales Revenue (Credit)
                    debit: 0,
                    credit: totalAmount,
                    description: `Sale to ${client.name}`
                }
            ];

            await createJournalEntry({
                companyId,
                entryDate: new Date(),
                entryType: 'sales_invoice',
                referenceType: 'DirectSale',
                referenceId: directSale._id,
                description: `Direct Sale #${saleNumber} to ${client.name} (${paymentType})`,
                lines: journalLines,
                createdBy: userId
            });
        } catch (journalError) {
            // If accounts don't exist, initialize default accounts and retry
            if (journalError.message.includes('Account not found')) {
                await initializeDefaultAccounts(companyId);

                const journalLines = paymentType === 'cash' ? [
                    {
                        accountCode: 'CASH',
                        debit: totalAmount,
                        credit: 0,
                        description: `Cash sale to ${client.name}`
                    },
                    {
                        accountCode: 'SALES',
                        debit: 0,
                        credit: totalAmount,
                        description: `Sale to ${client.name}`
                    }
                ] : [
                    {
                        accountCode: 'AR',
                        debit: totalAmount,
                        credit: 0,
                        description: `Receivable from ${client.name}`
                    },
                    {
                        accountCode: 'SALES',
                        debit: 0,
                        credit: totalAmount,
                        description: `Sale to ${client.name}`
                    }
                ];

                await createJournalEntry({
                    companyId,
                    entryDate: new Date(),
                    entryType: 'sales_invoice',
                    referenceType: 'DirectSale',
                    referenceId: directSale._id,
                    description: `Direct Sale #${saleNumber} to ${client.name} (${paymentType})`,
                    lines: journalLines,
                    createdBy: userId
                });
            } else {
                throw journalError;
            }
        }

        await session.commitTransaction();

        return {
            success: true,
            directSale,
            message: `Direct Sale #${saleNumber} created successfully`
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Delete a direct sale transaction
 * This reverses inventory changes and receivables
 * @param {String} saleId - Sale ID to delete
 * @param {String} companyId - Company ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDirectSale = async (saleId, companyId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the sale
        const sale = await DirectSale.findOne({ _id: saleId, companyId }).session(session);
        if (!sale) {
            throw new Error('Direct sale not found');
        }

        if (sale.saleStatus === 'cancelled') {
            throw new Error('Sale is already cancelled');
        }

        // 2. Reverse inventory changes
        for (const item of sale.items) {
            await StockItem.findOneAndUpdate(
                { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                { $inc: { quantity: item.quantity } },
                { session }
            );
        }

        // 3. Reverse receivable
        await Client.findByIdAndUpdate(
            sale.clientId,
            {
                $inc: {
                    totalPurchases: -sale.totalAmount,
                    totalReceivable: -sale.totalAmount
                }
            },
            { session }
        );

        // 4. Mark sale as cancelled
        sale.saleStatus = 'cancelled';
        await sale.save({ session });

        // 5. Delete associated stock transactions
        await StockTransaction.deleteMany(
            { referenceId: saleId, referenceModel: 'DirectSale', companyId },
            { session }
        );

        await session.commitTransaction();

        return {
            success: true,
            message: `Direct Sale #${sale.saleNumber} cancelled successfully`
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
