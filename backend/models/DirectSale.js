import mongoose from 'mongoose';

const directSaleItemSchema = new mongoose.Schema({
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
    sellingPrice: {
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

const directSaleSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    saleNumber: {
        type: Number,
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true
    },
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    clientPhone: {
        type: String,
        trim: true
    },
    clientEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    items: [directSaleItemSchema],
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
    saleDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    saleStatus: {
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
directSaleSchema.pre('save', function (next) {
    // For cash sales, set status to 'cash' and amountPaid to totalAmount
    if (this.paymentType === 'cash') {
        this.paymentStatus = 'cash';
        this.amountPaid = this.totalAmount;
    } else {
        // For credit sales, calculate status based on amountPaid
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
directSaleSchema.index({ companyId: 1, saleDate: -1 });
directSaleSchema.index({ companyId: 1, clientId: 1, saleDate: -1 });
directSaleSchema.index({ companyId: 1, saleNumber: 1 }, { unique: true });

export default mongoose.model('DirectSale', directSaleSchema);
