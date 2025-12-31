import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    transactionType: {
        type: String,
        enum: ['sale', 'purchase'],
        required: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'transactionModel'
    },
    transactionModel: {
        type: String,
        enum: ['Sale', 'Purchase', 'SalesOrder', 'PurchaseOrder'],
        required: true
    },
    transactionNumber: {
        type: String,
        trim: true
    },
    partyType: {
        type: String,
        enum: ['client', 'supplier'],
        required: true
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'partyModel'
    },
    partyModel: {
        type: String,
        enum: ['Client', 'Supplier'],
        required: true
    },
    partyName: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
        default: 'cash'
    },
    paymentDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    referenceNumber: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    recordedBy: {
        type: String,
        required: true,
        trim: true
    },
    // Track which invoices this payment was allocated to (for client/supplier level payments)
    allocations: [{
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        invoiceNumber: String,
        amountAllocated: Number,
        status: {
            type: String,
            enum: ['cleared', 'partial']
        }
    }],
    // AUDIT FIX - TASK 6: Track journal entry creation status
    journalEntryStatus: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
    },
    journalEntryError: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
paymentSchema.index({ companyId: 1, transactionId: 1, paymentDate: -1 }); // Transaction payment history
paymentSchema.index({ companyId: 1, partyId: 1, paymentDate: -1 }); // Party payment history
paymentSchema.index({ companyId: 1, paymentDate: -1 }); // All payments by date
paymentSchema.index({ companyId: 1, transactionType: 1, paymentDate: -1 }); // Payments by type

export default mongoose.model('Payment', paymentSchema);
