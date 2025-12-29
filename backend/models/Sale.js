import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
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
        ref: 'Warehouse'
    },
    warehouseName: {
        type: String
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

const saleSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
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
    items: [saleItemSchema],
    wages: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Invoice and payment tracking fields
    invoiceNumber: {
        type: Number,
        index: true
    },
    invoiceDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    amountDue: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }],
    lastPaymentDate: {
        type: Date
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    isOverdue: {
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
        default: 'cash'
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
    saleDate: {
        type: Date,
        default: Date.now,
        index: true // Index for date-based queries
    }
}, {
    timestamps: true
});

// Calculate amount due before saving
saleSchema.pre('save', function (next) {
    // Calculate amount due
    this.amountDue = this.totalAmount - this.amountPaid;

    // Auto-update payment status based on amounts
    if (this.amountPaid === 0) {
        this.paymentStatus = 'pending';
    } else if (this.amountPaid >= this.totalAmount) {
        this.paymentStatus = 'paid';
    } else {
        this.paymentStatus = 'partial';
    }

    // Check if overdue
    if (this.dueDate && this.amountDue > 0) {
        this.isOverdue = new Date() > this.dueDate;
    }

    next();
});

// Compound indexes for common queries
saleSchema.index({ companyId: 1, saleDate: -1 }); // Recent sales
saleSchema.index({ companyId: 1, clientName: 1 }); // Client-based queries
saleSchema.index({ companyId: 1, paymentStatus: 1 }); // Payment status queries
saleSchema.index({ companyId: 1, isOverdue: 1 }); // Overdue sales
saleSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true, sparse: true }); // Unique invoice numbers per company

export default mongoose.model('Sale', saleSchema);
