import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    journalEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JournalEntry',
        required: true,
        index: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LedgerAccount',
        required: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    debit: {
        type: Number,
        default: 0,
        min: 0
    },
    credit: {
        type: Number,
        default: 0,
        min: 0
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for journal entry lookups
journalLineSchema.index({ companyId: 1, journalEntryId: 1 });

// Index for account-based queries
journalLineSchema.index({ companyId: 1, accountId: 1 });

// Validation: Either debit or credit must be non-zero, but not both
journalLineSchema.pre('save', function (next) {
    if (this.debit > 0 && this.credit > 0) {
        next(new Error('A journal line cannot have both debit and credit'));
    }
    if (this.debit === 0 && this.credit === 0) {
        next(new Error('A journal line must have either debit or credit'));
    }
    next();
});

const JournalLine = mongoose.model('JournalLine', journalLineSchema);

export default JournalLine;
