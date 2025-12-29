import mongoose from 'mongoose';

const cashbookBalanceSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true
    },
    openingBalance: {
        type: Number,
        required: true,
        default: 0
    },
    closingBalance: {
        type: Number,
        required: true,
        default: 0
    },
    totalIncome: {
        type: Number,
        default: 0,
        min: 0
    },
    totalExpense: {
        type: Number,
        default: 0,
        min: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Compound index for unique date per company
cashbookBalanceSchema.index({ companyId: 1, date: 1 }, { unique: true });

// Index for date-based queries
cashbookBalanceSchema.index({ companyId: 1, date: -1 });

const CashbookBalance = mongoose.model('CashbookBalance', cashbookBalanceSchema);

export default CashbookBalance;
