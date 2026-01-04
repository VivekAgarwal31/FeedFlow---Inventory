import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
    // Analytics fields
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalRevenue: {
        type: Number,
        default: 0,
        min: 0
    },
    salesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastPurchaseDate: {
        type: Date
    },
    // Credit limit and payment tracking fields
    creditLimit: {
        type: Number,
        default: 0,
        min: 0
    },
    currentCredit: {
        type: Number,
        default: 0,
        min: 0
    },
    openingBalance: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Initial receivable balance when client was created (never modified)'
    },
    overpaidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalReceivable: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentTerms: {
        type: String,
        trim: true,
        default: 'Net 30'
    },
    defaultDueDays: {
        type: Number,
        default: 30,
        min: 0
    },
    overdueAmount: {
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
    creditStatus: {
        type: String,
        enum: ['good', 'warning', 'exceeded', 'blocked'],
        default: 'good'
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual field for frontend compatibility
clientSchema.virtual('lastPurchase').get(function () {
    return this.lastPurchaseDate;
});

// Virtual field for credit usage percentage
clientSchema.virtual('creditUsed').get(function () {
    if (this.creditLimit === 0) return 0;
    return Math.round((this.currentCredit / this.creditLimit) * 100);
});

// Method to check if client can make a purchase
clientSchema.methods.canMakePurchase = function (amount) {
    if (this.creditLimit === 0) return { allowed: true }; // No limit set

    const newCredit = this.currentCredit + amount;

    if (newCredit > this.creditLimit) {
        return {
            allowed: false,
            message: `Credit limit exceeded. Available: ₹${(this.creditLimit - this.currentCredit).toFixed(2)}`,
            currentCredit: this.currentCredit,
            creditLimit: this.creditLimit,
            available: this.creditLimit - this.currentCredit
        };
    }

    return { allowed: true };
};

// Method to update credit status
clientSchema.methods.updateCreditStatus = function () {
    if (this.creditLimit === 0) {
        this.creditStatus = 'good';
        return;
    }

    const usagePercent = (this.currentCredit / this.creditLimit) * 100;

    if (usagePercent >= 100) {
        this.creditStatus = 'exceeded';
    } else if (usagePercent >= 80) {
        this.creditStatus = 'warning';
    } else {
        this.creditStatus = 'good';
    }
};

// Ensure virtuals are included in JSON
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

// Compound indexes for queries
clientSchema.index({ companyId: 1, isActive: 1 });
clientSchema.index({ companyId: 1, totalRevenue: -1 }); // Top clients
clientSchema.index({ companyId: 1, creditStatus: 1 }); // Credit status queries
clientSchema.index({ companyId: 1, currentCredit: -1 }); // Outstanding credit

// Ensure client names are unique within a company
clientSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.model('Client', clientSchema);
