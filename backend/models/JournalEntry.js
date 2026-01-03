import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    entryNumber: {
        type: Number,
        required: true
    },
    entryDate: {
        type: Date,
        required: true,
        index: true
    },
    entryType: {
        type: String,
        enum: [
            'sales_invoice',
            'payment_received',
            'purchase_invoice',
            'payment_made',
            'manual_income',
            'manual_expense',
            'opening_balance',
            'adjustment'
        ],
        required: true
    },
    referenceType: {
        type: String,
        enum: ['SalesOrder', 'PurchaseOrder', 'Payment', 'Manual', 'DirectSale', 'DirectPurchase', null],
        default: null
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index for unique entry number per company
journalEntrySchema.index({ companyId: 1, entryNumber: 1 }, { unique: true });

// Index for date-based queries
journalEntrySchema.index({ companyId: 1, entryDate: 1 });

// Index for reference lookups
journalEntrySchema.index({ companyId: 1, referenceType: 1, referenceId: 1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

export default JournalEntry;
