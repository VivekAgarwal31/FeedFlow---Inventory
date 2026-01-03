import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    totalPurchases: {
        type: Number,
        default: 0
    },
    purchaseCount: {
        type: Number,
        default: 0
    },
    lastPurchaseDate: {
        type: Date
    },
    // Payment tracking fields
    currentPayable: {
        type: Number,
        default: 0,
        min: 0
    },
    overduePayable: {
        type: Number,
        default: 0,
        min: 0
    },
    lastPaymentDate: {
        type: Date
    },
    lastPaymentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    averagePaymentDays: {
        type: Number,
        default: 0,
        min: 0
    },
    overpaidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPayable: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual field for frontend compatibility
supplierSchema.virtual('lastPurchase').get(function () {
    return this.lastPurchaseDate;
});

// Ensure virtuals are included in JSON
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

// Compound index for company-specific queries
supplierSchema.index({ companyId: 1, isActive: 1 });

// Ensure supplier names are unique within a company
supplierSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.model('Supplier', supplierSchema);
