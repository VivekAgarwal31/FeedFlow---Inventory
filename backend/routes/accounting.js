import express from 'express';
import LedgerAccount from '../models/LedgerAccount.js';
import JournalEntry from '../models/JournalEntry.js';
import JournalLine from '../models/JournalLine.js';
import CashbookBalance from '../models/CashbookBalance.js';
import SalesOrder from '../models/SalesOrder.js';
import Payment from '../models/Payment.js';
import DeliveryIn from '../models/DeliveryIn.js';
import DeliveryOut from '../models/DeliveryOut.js';
import StockTransaction from '../models/StockTransaction.js';
import Company from '../models/Company.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { createJournalEntry, initializeDefaultAccounts } from '../utils/journalEntry.js';

const router = express.Router();

// Initialize default accounts for a company
router.post('/accounts/initialize', authenticate, requirePermission('isOwner'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        // Check if accounts already exist
        const existingAccounts = await LedgerAccount.countDocuments({ companyId });
        if (existingAccounts > 0) {
            return res.status(400).json({ message: 'Accounts already initialized' });
        }

        const accounts = await initializeDefaultAccounts(companyId);

        res.json({
            message: 'Default accounts initialized successfully',
            accounts
        });
    } catch (error) {
        console.error('Initialize accounts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all ledger accounts
router.get('/accounts', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const accounts = await LedgerAccount.find({ companyId, isActive: true })
            .sort({ accountCode: 1 })
            .lean();

        res.json({ accounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create ledger account
router.post('/accounts', authenticate, requirePermission('canManageAccounting'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { accountCode, accountName, accountType, parentAccount } = req.body;

        const account = new LedgerAccount({
            companyId,
            accountCode,
            accountName,
            accountType,
            parentAccount,
            isActive: true,
            isSystemAccount: false
        });

        await account.save();

        res.status(201).json({
            message: 'Account created successfully',
            account
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get entries register for a date
router.get('/entries-register', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const date = req.query.date ? new Date(req.query.date) : new Date();

        // Set date range for the day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get credit sales (created on this date, not fully paid)
        const creditSales = await SalesOrder.find({
            companyId,
            orderDate: { $gte: startOfDay, $lte: endOfDay },
            paymentStatus: { $in: ['pending', 'partial'] }
        }).select('orderNumber clientName orderDate totalAmount amountPaid amountDue paymentStatus').lean();

        // Get payments received on this date
        const paymentsReceived = await Payment.find({
            companyId,
            paymentDate: { $gte: startOfDay, $lte: endOfDay },
            transactionType: 'sale'  // Changed from paymentType to transactionType
        }).sort({ createdAt: -1 }).lean();

        const paymentsData = paymentsReceived.map(payment => ({
            paymentDate: payment.paymentDate,
            customerName: payment.partyName || 'N/A',  // Use partyName instead of clientId
            invoiceReference: payment.transactionNumber || 'N/A',
            paymentMode: payment.paymentMode || payment.paymentMethod || 'Cash',
            amountReceived: payment.amount
        }));

        const totals = {
            totalCreditSales: creditSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
            totalPaymentsReceived: paymentsReceived.reduce((sum, payment) => sum + payment.amount, 0)
        };

        res.json({
            date,
            creditSales,
            paymentsReceived: paymentsData,
            totals
        });
    } catch (error) {
        console.error('Get entries register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get cashbook for a date
router.get('/cashbook', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const date = req.query.date ? new Date(req.query.date) : new Date();

        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        // Get or create cashbook balance
        let balance = await CashbookBalance.findOne({
            companyId,
            date: dateOnly
        });

        if (!balance) {
            // Get previous day's closing balance
            const previousBalance = await CashbookBalance.findOne({
                companyId,
                date: { $lt: dateOnly }
            }).sort({ date: -1 });

            balance = new CashbookBalance({
                companyId,
                date: dateOnly,
                openingBalance: previousBalance?.closingBalance || 0,
                totalIncome: 0,
                totalExpense: 0,
                closingBalance: previousBalance?.closingBalance || 0
            });

            await balance.save();
        }

        // Get journal entries for the date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const entries = await JournalEntry.find({
            companyId,
            entryDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ createdAt: -1 }).lean();

        const entryIds = entries.map(e => e._id);

        // Get cash/bank accounts
        const cashBankAccounts = await LedgerAccount.find({
            companyId,
            accountName: { $in: ['Cash', 'Bank'] }
        }).select('_id accountName');

        const cashBankIds = cashBankAccounts.map(a => a._id.toString());

        // Get journal lines for cash/bank accounts
        const lines = await JournalLine.find({
            companyId,
            journalEntryId: { $in: entryIds },
            accountId: { $in: cashBankIds }
        }).populate('journalEntryId').lean();

        // Separate incomes and expenses
        const incomes = [];
        const expenses = [];

        for (const line of lines) {
            const entry = line.journalEntryId;

            if (line.debit > 0) {
                // Money coming in
                incomes.push({
                    date: entry.entryDate,
                    source: entry.description || entry.entryType,
                    reference: entry.referenceType ? `${entry.referenceType}-${entry.referenceId}` : 'Manual',
                    paymentMode: line.accountName,
                    amount: line.debit,
                    createdAt: entry.createdAt  // Add createdAt for sorting
                });
            } else if (line.credit > 0) {
                // Money going out
                expenses.push({
                    date: entry.entryDate,
                    category: entry.description || entry.entryType,
                    paidTo: 'N/A',
                    paymentMode: line.accountName,
                    amount: line.credit,
                    createdAt: entry.createdAt  // Add createdAt for sorting
                });
            }
        }

        // Sort by createdAt descending (latest first)
        incomes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            date: dateOnly,
            openingBalance: balance.openingBalance,
            incomes,
            expenses,
            totals: {
                totalIncome: balance.totalIncome,
                totalExpense: balance.totalExpense
            },
            closingBalance: balance.closingBalance,
            isEdited: balance.isEdited
        });
    } catch (error) {
        console.error('Get cashbook error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update opening balance for a date
router.put('/cashbook/opening-balance', authenticate, requirePermission('canManageAccounting'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { date, openingBalance } = req.body;

        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        let balance = await CashbookBalance.findOne({
            companyId,
            date: dateOnly
        });

        if (!balance) {
            balance = new CashbookBalance({
                companyId,
                date: dateOnly,
                openingBalance,
                totalIncome: 0,
                totalExpense: 0,
                closingBalance: openingBalance
            });
        } else {
            balance.openingBalance = openingBalance;
            balance.closingBalance = openingBalance + balance.totalIncome - balance.totalExpense;
        }

        balance.isEdited = true;
        balance.editedBy = req.user._id;

        await balance.save();

        res.json({
            message: 'Opening balance updated successfully',
            balance
        });
    } catch (error) {
        console.error('Update opening balance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create manual journal entry
router.post('/journal-entries', authenticate, requirePermission('canManageAccounting'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { entryDate, entryType, description, lines } = req.body;

        const result = await createJournalEntry({
            companyId,
            entryDate: new Date(entryDate),
            entryType,
            referenceType: 'Manual',
            referenceId: null,
            description,
            lines,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Journal entry created successfully',
            ...result
        });
    } catch (error) {
        console.error('Create journal entry error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Calculate daily wages
router.get('/wages/calculate', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const date = req.query.date ? new Date(req.query.date) : new Date();

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get company wages per bag
        const company = await Company.findById(companyId);
        const wagesPerBag = company?.wagesPerBag || 0;

        // Get deliveries in (purchase orders)
        const deliveriesIn = await DeliveryIn.find({
            companyId,
            receiptDate: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const bagsReceived = deliveriesIn.reduce((sum, delivery) => {
            return sum + delivery.items.reduce((itemSum, item) => {
                return itemSum + (item.quantity || 0);
            }, 0);
        }, 0);

        // Get stock moves
        const stockMoves = await StockTransaction.find({
            companyId,
            type: 'stock_move',
            transactionDate: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const bagsMoved = stockMoves.reduce((sum, move) => {
            return sum + (move.quantity || 0);
        }, 0);

        // Get deliveries out (sales orders)
        const deliveriesOut = await DeliveryOut.find({
            companyId,
            deliveryDate: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const bagsDelivered = deliveriesOut.reduce((sum, delivery) => {
            return sum + delivery.items.reduce((itemSum, item) => {
                return itemSum + (item.quantity || 0);
            }, 0);
        }, 0);

        const totalBags = bagsReceived + bagsMoved + bagsDelivered;
        const totalWages = totalBags * wagesPerBag;

        res.json({
            date,
            bagsReceived,
            bagsMoved,
            bagsDelivered,
            totalBags,
            wagesPerBag,
            totalWages
        });
    } catch (error) {
        console.error('Calculate wages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Record wages journal entry
router.post('/wages/record', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { date, totalWages, description } = req.body;

        if (!totalWages || totalWages <= 0) {
            return res.status(400).json({ message: 'Total wages must be greater than 0' });
        }

        // Check if accounts are initialized, if not, initialize them
        const accountCount = await LedgerAccount.countDocuments({ companyId });
        if (accountCount === 0) {
            await initializeDefaultAccounts(companyId);
        }

        const result = await createJournalEntry({
            companyId,
            entryDate: new Date(date),
            entryType: 'manual_expense',
            referenceType: 'Manual',
            referenceId: null,
            description: description || `Daily wages for ${new Date(date).toLocaleDateString()}`,
            lines: [
                { accountName: 'Wages Expense', debit: totalWages, credit: 0 },
                { accountName: 'Cash', debit: 0, credit: totalWages }
            ],
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Wages recorded successfully',
            ...result
        });
    } catch (error) {
        console.error('Record wages error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create manual income/expense entry
router.post('/manual-entry', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const { entryDate, type, category, description, amount, paymentMode } = req.body;

        // Validate input
        if (!type || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Type and valid amount are required' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Type must be income or expense' });
        }

        // Check if accounts are initialized, if not, initialize them
        const accountCount = await LedgerAccount.countDocuments({ companyId });
        if (accountCount === 0) {
            await initializeDefaultAccounts(companyId);
        }

        const accountName = (paymentMode === 'cash') ? 'Cash' : 'Bank';
        let lines;

        if (type === 'income') {
            // Income: Debit Cash/Bank, Credit Other Income
            lines = [
                { accountName, debit: amount, credit: 0 },
                { accountName: 'Other Income', debit: 0, credit: amount }
            ];
        } else {
            // Expense: Debit Other Expense, Credit Cash/Bank
            lines = [
                { accountName: 'Other Expense', debit: amount, credit: 0 },
                { accountName, debit: 0, credit: amount }
            ];
        }

        const result = await createJournalEntry({
            companyId,
            entryDate: new Date(entryDate || new Date()),
            entryType: type === 'income' ? 'manual_income' : 'manual_expense',
            referenceType: 'Manual',
            referenceId: null,
            description: `${category || type} - ${description || ''}`.trim(),
            lines,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: `${type === 'income' ? 'Income' : 'Expense'} entry created successfully`,
            ...result
        });
    } catch (error) {
        console.error('Create manual entry error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
