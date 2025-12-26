import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
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

const purchaseSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
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
    invoiceNumber: {
        type: String,
        trim: true
    },
    items: [purchaseItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Payment tracking fields
    billNumber: {
        type: String,
        trim: true
    },
    billDate: {
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
    purchaseDate: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Calculate amount due before saving
purchaseSchema.pre('save', function (next) {
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
purchaseSchema.index({ companyId: 1, purchaseDate: -1 }); // Recent purchases
purchaseSchema.index({ companyId: 1, supplierId: 1, purchaseDate: -1 }); // Supplier history
purchaseSchema.index({ companyId: 1, paymentStatus: 1 }); // Payment tracking
purchaseSchema.index({ companyId: 1, isOverdue: 1 }); // Overdue purchases

export default mongoose.model('Purchase', purchaseSchema);
