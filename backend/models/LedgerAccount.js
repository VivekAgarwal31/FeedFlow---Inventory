import mongoose from 'mongoose';

const ledgerAccountSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    accountCode: {
        type: String,
        required: true,
        trim: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    accountType: {
        type: String,
        enum: ['asset', 'liability', 'income', 'expense', 'equity'],
        required: true
    },
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LedgerAccount',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSystemAccount: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for unique account code per company
ledgerAccountSchema.index({ companyId: 1, accountCode: 1 }, { unique: true });

// Index for querying by type
ledgerAccountSchema.index({ companyId: 1, accountType: 1 });

const LedgerAccount = mongoose.model('LedgerAccount', ledgerAccountSchema);

export default LedgerAccount;
