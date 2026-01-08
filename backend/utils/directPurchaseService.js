import mongoose from 'mongoose';
import StockItem from '../models/StockItem.js';
import Supplier from '../models/Supplier.js';
import DirectPurchase from '../models/DirectPurchase.js';
import StockTransaction from '../models/StockTransaction.js';
import JournalEntry from '../models/JournalEntry.js';
import JournalLine from '../models/JournalLine.js';
import { createJournalEntry, initializeDefaultAccounts } from './journalEntry.js';

/**
 * Create a direct purchase transaction
 * This increases inventory and creates a payable for the supplier
 * @param {Object} purchaseData - Purchase data
 * @param {String} userId - User performing the action
 * @returns {Promise<Object>} Created purchase and transaction details
 */
export const createDirectPurchase = async (purchaseData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { companyId, supplierId, items, notes, staffName, paymentType, paymentMethod } = purchaseData;

        // 1. Validate supplier exists
        const supplier = await Supplier.findOne({ _id: supplierId, companyId }).session(session);
        if (!supplier) {
            throw new Error('Supplier not found');
        }

        // 2. Validate items and calculate totals
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            // Find or create stock item for this warehouse
            let stockItem = await StockItem.findOne({
                itemName: item.itemName,
                companyId,
                warehouseId: item.warehouseId
            }).session(session);

            // If item doesn't exist in this warehouse, create it
            if (!stockItem) {
                stockItem = new StockItem({
                    companyId,
                    itemName: item.itemName,
                    warehouseId: item.warehouseId,
                    quantity: 0,
                    costPrice: item.costPrice,
                    sellingPrice: item.costPrice * 1.2  // Default markup
                });
                await stockItem.save({ session });
            }

            const lineTotal = item.quantity * item.costPrice;
            totalAmount += lineTotal;

            validatedItems.push({
                itemId: stockItem._id,  // Use the actual stock item ID from DB
                itemName: stockItem.itemName,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName,
                quantity: item.quantity,
                costPrice: item.costPrice,
                total: lineTotal
            });
        }

        // 3. Generate purchase number
        const lastPurchase = await DirectPurchase.findOne({ companyId })
            .sort({ purchaseNumber: -1 })
            .session(session);
        const purchaseNumber = lastPurchase ? lastPurchase.purchaseNumber + 1 : 1;

        // 4. Create direct purchase record
        const directPurchase = new DirectPurchase({
            companyId,
            purchaseNumber,
            supplierId,
            supplierName: supplier.name,
            items: validatedItems,
            totalAmount,
            paymentType: paymentType || 'cash',
            paymentMethod: paymentMethod || 'cash',
            purchaseDate: new Date(),
            purchaseStatus: 'completed',
            notes,
            staffName,
            performedBy: userId
        });

        await directPurchase.save({ session });

        // 5. Increase inventory
        for (const item of validatedItems) {
            const existingStock = await StockItem.findOne({
                _id: item.itemId,
                companyId,
                warehouseId: item.warehouseId
            }).session(session);

            if (existingStock) {
                // Update existing stock
                await StockItem.findOneAndUpdate(
                    { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                    { $inc: { quantity: item.quantity } },
                    { session }
                );
            } else {
                // Create new stock entry for this warehouse
                const baseItem = await StockItem.findOne({
                    _id: item.itemId,
                    companyId
                }).session(session);

                const newStockEntry = new StockItem({
                    companyId,
                    itemName: item.itemName,
                    warehouseId: item.warehouseId,
                    quantity: item.quantity,
                    unit: baseItem?.unit || 'pcs',
                    minStockLevel: baseItem?.minStockLevel || 0
                });

                await newStockEntry.save({ session });
            }
        }

        // 6. Update supplier totals (payable only for credit purchases)
        const supplierUpdate = {
            $inc: {
                totalPurchases: totalAmount
            },
            lastPurchaseDate: new Date()
        };

        // Only add to payable if it's a credit purchase
        // Update BOTH currentPayable (for order-based system) and totalPayable (for direct purchases)
        if (paymentType === 'credit') {
            supplierUpdate.$inc.currentPayable = totalAmount;
            supplierUpdate.$inc.totalPayable = totalAmount;
        }

        await Supplier.findByIdAndUpdate(supplierId, supplierUpdate, { session });

        // 7. Create single stock transaction record with all items
        const stockTransaction = new StockTransaction({
            companyId,
            type: 'direct_purchase',
            items: validatedItems.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName
            })),
            referenceId: directPurchase._id,
            referenceModel: 'DirectPurchase',
            notes: `Direct Purchase #${purchaseNumber} from ${supplier.name}`,
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
                    accountCode: 'PURCHASE',  // Purchase Expense (Debit)
                    debit: totalAmount,
                    credit: 0,
                    description: `Purchase from ${supplier.name}`
                },
                {
                    accountCode: 'CASH',  // Cash (Credit)
                    debit: 0,
                    credit: totalAmount,
                    description: `Cash payment to ${supplier.name}`
                }
            ] : [
                {
                    accountCode: 'PURCHASE',  // Purchase Expense (Debit)
                    debit: totalAmount,
                    credit: 0,
                    description: `Purchase from ${supplier.name}`
                },
                {
                    accountCode: 'AP',  // Accounts Payable (Credit)
                    debit: 0,
                    credit: totalAmount,
                    description: `Payable to ${supplier.name}`
                }
            ];

            await createJournalEntry({
                companyId,
                entryDate: new Date(),
                entryType: 'purchase_invoice',
                referenceType: 'DirectPurchase',
                referenceId: directPurchase._id,
                description: `Direct Purchase #${purchaseNumber} from ${supplier.name} (${paymentType})`,
                lines: journalLines,
                createdBy: userId
            });
        } catch (journalError) {
            // If accounts don't exist, initialize default accounts and retry
            if (journalError.message.includes('Account not found')) {
                await initializeDefaultAccounts(companyId);

                const journalLines = paymentType === 'cash' ? [
                    {
                        accountCode: 'PURCHASE',
                        debit: totalAmount,
                        credit: 0,
                        description: `Purchase from ${supplier.name}`
                    },
                    {
                        accountCode: 'CASH',
                        debit: 0,
                        credit: totalAmount,
                        description: `Cash payment to ${supplier.name}`
                    }
                ] : [
                    {
                        accountCode: 'PURCHASE',
                        debit: totalAmount,
                        credit: 0,
                        description: `Purchase from ${supplier.name}`
                    },
                    {
                        accountCode: 'AP',
                        debit: 0,
                        credit: totalAmount,
                        description: `Payable to ${supplier.name}`
                    }
                ];

                await createJournalEntry({
                    companyId,
                    entryDate: new Date(),
                    entryType: 'purchase_invoice',
                    referenceType: 'DirectPurchase',
                    referenceId: directPurchase._id,
                    description: `Direct Purchase #${purchaseNumber} from ${supplier.name} (${paymentType})`,
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
            directPurchase,
            message: `Direct Purchase #${purchaseNumber} created successfully`
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Delete a direct purchase transaction
 * This reverses inventory changes and payables
 * @param {String} purchaseId - Purchase ID to delete
 * @param {String} companyId - Company ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDirectPurchase = async (purchaseId, companyId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the purchase
        const purchase = await DirectPurchase.findOne({ _id: purchaseId, companyId }).session(session);
        if (!purchase) {
            throw new Error('Direct purchase not found');
        }

        if (purchase.purchaseStatus === 'cancelled') {
            throw new Error('Purchase is already cancelled');
        }

        // 2. Reverse inventory changes
        for (const item of purchase.items) {
            const stockItem = await StockItem.findOne({
                _id: item.itemId,
                companyId,
                warehouseId: item.warehouseId
            }).session(session);

            if (stockItem) {
                if (stockItem.quantity < item.quantity) {
                    throw new Error(`Cannot reverse purchase: insufficient stock for ${item.itemName} in ${item.warehouseName}`);
                }

                await StockItem.findOneAndUpdate(
                    { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            }
        }

        // 3. Reverse payable
        await Supplier.findByIdAndUpdate(
            purchase.supplierId,
            {
                $inc: {
                    totalPurchases: -purchase.totalAmount,
                    totalPayable: -purchase.totalAmount
                }
            },
            { session }
        );

        // 4. Mark purchase as cancelled
        purchase.purchaseStatus = 'cancelled';
        await purchase.save({ session });

        // 5. Delete associated stock transactions
        await StockTransaction.deleteMany(
            { referenceId: purchaseId, referenceModel: 'DirectPurchase', companyId },
            { session }
        );

        await session.commitTransaction();

        return {
            success: true,
            message: `Direct Purchase #${purchase.purchaseNumber} cancelled successfully`
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Update a direct purchase transaction
 * This reverts old inventory/payables and applies new ones
 * @param {String} purchaseId - Purchase ID to update
 * @param {Object} updateData - Updated purchase data
 * @param {String} companyId - Company ID
 * @param {String} userId - User performing the update
 * @returns {Promise<Object>} Update result
 */
export const updateDirectPurchase = async (purchaseId, updateData, companyId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the existing purchase
        const existingPurchase = await DirectPurchase.findOne({ _id: purchaseId, companyId }).session(session);
        if (!existingPurchase) {
            throw new Error('Direct purchase not found');
        }

        if (existingPurchase.purchaseStatus === 'cancelled') {
            throw new Error('Cannot edit a cancelled purchase');
        }

        const { items, notes } = updateData;

        // 2. Validate new items and calculate new total
        let newTotalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            let stockItem = await StockItem.findOne({
                itemName: item.itemName,
                companyId,
                warehouseId: item.warehouseId
            }).session(session);

            // Create stock item if it doesn't exist
            if (!stockItem) {
                stockItem = new StockItem({
                    companyId,
                    itemName: item.itemName,
                    warehouseId: item.warehouseId,
                    quantity: 0,
                    costPrice: item.costPrice,
                    sellingPrice: item.costPrice * 1.2
                });
                await stockItem.save({ session });
            }

            const lineTotal = item.quantity * item.costPrice;
            newTotalAmount += lineTotal;

            validatedItems.push({
                itemId: stockItem._id,
                itemName: stockItem.itemName,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName,
                quantity: item.quantity,
                costPrice: item.costPrice,
                total: lineTotal
            });
        }

        // 3. Revert old inventory changes (subtract the quantities)
        for (const item of existingPurchase.items) {
            await StockItem.findOneAndUpdate(
                { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                { $inc: { quantity: -item.quantity } },
                { session }
            );
        }

        // 4. Apply new inventory changes (add the new quantities)
        for (const item of validatedItems) {
            await StockItem.findOneAndUpdate(
                { _id: item.itemId, companyId, warehouseId: item.warehouseId },
                { $inc: { quantity: item.quantity } },
                { session }
            );
        }

        // 5. Update supplier payables (only for credit purchases)
        if (existingPurchase.paymentType === 'credit') {
            const oldAmount = existingPurchase.totalAmount;
            const amountDifference = newTotalAmount - oldAmount;

            await Supplier.findByIdAndUpdate(
                existingPurchase.supplierId,
                {
                    $inc: {
                        totalPurchases: amountDifference,
                        currentPayable: amountDifference,
                        totalPayable: amountDifference
                    }
                },
                { session }
            );
        } else {
            // For cash purchases, only update totalPurchases
            const amountDifference = newTotalAmount - existingPurchase.totalAmount;
            await Supplier.findByIdAndUpdate(
                existingPurchase.supplierId,
                {
                    $inc: {
                        totalPurchases: amountDifference
                    }
                },
                { session }
            );
        }

        // 6. Update the purchase record
        existingPurchase.items = validatedItems;
        existingPurchase.totalAmount = newTotalAmount;
        if (notes !== undefined) {
            existingPurchase.notes = notes;
        }
        await existingPurchase.save({ session });

        // 7. Update stock transaction record
        await StockTransaction.findOneAndUpdate(
            { referenceId: purchaseId, referenceModel: 'DirectPurchase', companyId },
            {
                items: validatedItems.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    warehouseId: item.warehouseId,
                    warehouseName: item.warehouseName
                })),
                quantity: validatedItems.reduce((sum, item) => sum + item.quantity, 0)
            },
            { session }
        );

        // 8. Update journal entry
        try {
            // Delete old journal entries
            const oldJournalEntries = await JournalEntry.find({
                referenceType: 'DirectPurchase',
                referenceId: purchaseId,
                companyId
            }).session(session);

            for (const entry of oldJournalEntries) {
                await JournalLine.deleteMany({ journalEntryId: entry._id }, { session });
                await JournalEntry.findByIdAndDelete(entry._id, { session });
            }

            // Create new journal entry
            const supplier = await Supplier.findById(existingPurchase.supplierId).session(session);
            const journalLines = existingPurchase.paymentType === 'cash' ? [
                {
                    accountCode: 'PURCHASE',
                    debit: newTotalAmount,
                    credit: 0,
                    description: `Purchase from ${supplier.name}`
                },
                {
                    accountCode: 'CASH',
                    debit: 0,
                    credit: newTotalAmount,
                    description: `Cash payment to ${supplier.name}`
                }
            ] : [
                {
                    accountCode: 'PURCHASE',
                    debit: newTotalAmount,
                    credit: 0,
                    description: `Purchase from ${supplier.name}`
                },
                {
                    accountCode: 'AP',
                    debit: 0,
                    credit: newTotalAmount,
                    description: `Payable to ${supplier.name}`
                }
            ];

            await createJournalEntry({
                companyId,
                entryDate: existingPurchase.purchaseDate,
                entryType: 'purchase_invoice',
                referenceType: 'DirectPurchase',
                referenceId: existingPurchase._id,
                description: `Direct Purchase #${existingPurchase.purchaseNumber} from ${supplier.name} (${existingPurchase.paymentType}) - Updated`,
                lines: journalLines,
                createdBy: userId
            });
        } catch (journalError) {
            console.error('Journal entry update error:', journalError);
            // Don't fail the update if journal entry fails
        }

        await session.commitTransaction();

        return {
            success: true,
            directPurchase: existingPurchase,
            message: `Direct Purchase #${existingPurchase.purchaseNumber} updated successfully`
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
