import JournalEntry from '../models/JournalEntry.js';
import JournalLine from '../models/JournalLine.js';
import LedgerAccount from '../models/LedgerAccount.js';
import CashbookBalance from '../models/CashbookBalance.js';

/**
 * Create a journal entry with lines
 * @param {Object} data - Journal entry data
 * @param {ObjectId} data.companyId - Company ID
 * @param {Date} data.entryDate - Entry date
 * @param {String} data.entryType - Type of entry
 * @param {String} data.referenceType - Reference model type
 * @param {ObjectId} data.referenceId - Reference document ID
 * @param {String} data.description - Entry description
 * @param {Array} data.lines - Array of journal lines
 * @param {ObjectId} data.createdBy - User ID
 */
export async function createJournalEntry(data) {
    const { companyId, entryDate, entryType, referenceType, referenceId, description, lines, createdBy } = data;

    // Validate lines
    if (!lines || lines.length === 0) {
        throw new Error('Journal entry must have at least one line');
    }

    // Calculate total debit and credit
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
    }

    // Validate double-entry
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Journal entry not balanced: Debit=${totalDebit}, Credit=${totalCredit}`);
    }

    // Get next entry number
    const lastEntry = await JournalEntry.findOne({ companyId })
        .sort({ entryNumber: -1 })
        .select('entryNumber')
        .lean();

    const entryNumber = (lastEntry?.entryNumber || 0) + 1;

    // Create journal entry
    const journalEntry = new JournalEntry({
        companyId,
        entryNumber,
        entryDate,
        entryType,
        referenceType,
        referenceId,
        description,
        totalAmount: totalDebit, // or totalCredit, they're equal
        createdBy
    });

    await journalEntry.save();

    // Create journal lines
    const journalLines = [];
    for (const line of lines) {
        // Get account details
        const account = await LedgerAccount.findOne({
            companyId,
            $or: [
                { accountCode: line.accountCode },
                { accountName: line.accountName }
            ]
        });

        if (!account) {
            throw new Error(`Account not found: ${line.accountCode || line.accountName}`);
        }

        const journalLine = new JournalLine({
            companyId,
            journalEntryId: journalEntry._id,
            accountId: account._id,
            accountName: account.accountName,
            debit: line.debit || 0,
            credit: line.credit || 0,
            description: line.description || description
        });

        journalLines.push(journalLine);
    }

    await JournalLine.insertMany(journalLines);

    // Update cashbook balance if cash/bank account involved
    await updateCashbookBalance(companyId, entryDate, journalLines);

    return { journalEntry, journalLines };
}

/**
 * Update cashbook balance for a date
 */
async function updateCashbookBalance(companyId, date, journalLines) {
    // Check if any line affects cash or bank accounts
    const cashBankAccounts = await LedgerAccount.find({
        companyId,
        accountName: { $in: ['Cash', 'Bank'] }
    }).select('_id');

    const cashBankIds = cashBankAccounts.map(a => a._id.toString());

    let cashChange = 0;
    for (const line of journalLines) {
        if (cashBankIds.includes(line.accountId.toString())) {
            cashChange += (line.debit || 0) - (line.credit || 0);
        }
    }

    if (cashChange === 0) return;

    // Get or create cashbook balance for the date
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

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
    }

    // Update income/expense
    if (cashChange > 0) {
        balance.totalIncome += cashChange;
    } else {
        balance.totalExpense += Math.abs(cashChange);
    }

    balance.closingBalance = balance.openingBalance + balance.totalIncome - balance.totalExpense;

    await balance.save();

    // Update subsequent days' opening balances
    await updateSubsequentBalances(companyId, dateOnly, balance.closingBalance);
}

/**
 * Update opening balances for all days after the given date
 */
async function updateSubsequentBalances(companyId, fromDate, newClosingBalance) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const subsequentBalances = await CashbookBalance.find({
        companyId,
        date: { $gte: nextDate },
        isEdited: false // Only update non-manually-edited balances
    }).sort({ date: 1 });

    let currentOpening = newClosingBalance;

    for (const balance of subsequentBalances) {
        balance.openingBalance = currentOpening;
        balance.closingBalance = balance.openingBalance + balance.totalIncome - balance.totalExpense;
        await balance.save();
        currentOpening = balance.closingBalance;
    }
}

/**
 * Initialize default ledger accounts for a company
 */
export async function initializeDefaultAccounts(companyId) {
    const defaultAccounts = [
        { accountCode: 'CASH', accountName: 'Cash', accountType: 'asset', isSystemAccount: true },
        { accountCode: 'BANK', accountName: 'Bank', accountType: 'asset', isSystemAccount: true },
        { accountCode: 'AR', accountName: 'Accounts Receivable', accountType: 'asset', isSystemAccount: true },
        { accountCode: 'AP', accountName: 'Accounts Payable', accountType: 'liability', isSystemAccount: true },
        { accountCode: 'SALES', accountName: 'Sales Revenue', accountType: 'income', isSystemAccount: true },
        { accountCode: 'PURCHASE', accountName: 'Purchase Expense', accountType: 'expense', isSystemAccount: true },
        { accountCode: 'WAGES', accountName: 'Wages Expense', accountType: 'expense', isSystemAccount: true },
        { accountCode: 'OTHER_INCOME', accountName: 'Other Income', accountType: 'income', isSystemAccount: true },
        { accountCode: 'OTHER_EXPENSE', accountName: 'Other Expense', accountType: 'expense', isSystemAccount: true }
    ];

    const accounts = defaultAccounts.map(acc => ({
        ...acc,
        companyId,
        isActive: true
    }));

    await LedgerAccount.insertMany(accounts);

    return accounts;
}

export default { createJournalEntry, initializeDefaultAccounts };
