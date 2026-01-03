import mongoose from 'mongoose';

const directPurchaseItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockItem',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    warehouseName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    costPrice: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const directPurchaseSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    purchaseNumber: {
        type: Number,
        required: true,
        index: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
        index: true
    },
    supplierName: {
        type: String,
        required: true
    },
    items: [directPurchaseItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Payment tracking fields
    paymentType: {
        type: String,
        enum: ['cash', 'credit'],
        default: 'cash'
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['cash', 'pending', 'partial', 'paid'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
        default: 'cash'
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    purchaseStatus: {
        type: String,
        enum: ['completed', 'cancelled'],
        default: 'completed'
    },
    notes: {
        type: String,
        trim: true
    },
    staffName: {
        type: String,
        required: true,
        trim: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Pre-save hook to auto-calculate payment status
directPurchaseSchema.pre('save', function (next) {
    // For cash purchases, set status to 'cash' and amountPaid to totalAmount
    if (this.paymentType === 'cash') {
        this.paymentStatus = 'cash';
        this.amountPaid = this.totalAmount;
    } else {
        // For credit purchases, calculate status based on amountPaid
        if (this.amountPaid === 0) {
            this.paymentStatus = 'pending';
        } else if (this.amountPaid >= this.totalAmount) {
            this.paymentStatus = 'paid';
        } else {
            this.paymentStatus = 'partial';
        }
    }
    next();
});

// Compound indexes
directPurchaseSchema.index({ companyId: 1, purchaseDate: -1 });
directPurchaseSchema.index({ companyId: 1, supplierId: 1, purchaseDate: -1 });
directPurchaseSchema.index({ companyId: 1, purchaseNumber: 1 }, { unique: true });

export default mongoose.model('DirectPurchase', directPurchaseSchema);
