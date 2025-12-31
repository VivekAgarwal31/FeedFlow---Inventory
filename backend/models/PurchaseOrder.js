import mongoose from 'mongoose';
// AUDIT FIX - TASK 3: Import shared payment calculation utilities
import { calculatePaymentStatus, calculateAmountDue } from '../utils/paymentCalculations.js';

const purchaseOrderItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockItem',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    receivedQuantity: {
        type: Number,
        default: 0,
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

const purchaseOrderSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    orderNumber: {
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
    items: [purchaseOrderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'partially_received', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    expectedDeliveryDate: {
        type: Date
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
    // Receipt tracking
    linkedDeliveries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryIn'
    }],
    notes: {
        type: String,
        trim: true
    },
    staffName: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Update order status based on received quantities
purchaseOrderSchema.methods.updateOrderStatus = function () {
    let totalOrdered = 0;
    let totalReceived = 0;

    this.items.forEach(item => {
        totalOrdered += item.quantity;
        totalReceived += item.receivedQuantity;
    });

    if (totalReceived === 0) {
        this.orderStatus = 'pending';
    } else if (totalReceived >= totalOrdered) {
        this.orderStatus = 'completed';
    } else {
        this.orderStatus = 'partially_received';
    }
};

// AUDIT FIX - TASK 3: Use shared payment calculation utilities
// Calculate amount due before saving
purchaseOrderSchema.pre('save', function (next) {
    // Use shared utility for consistent calculation across all models
    this.amountDue = calculateAmountDue(this.totalAmount, this.amountPaid);

    // Use shared utility for consistent payment status logic
    this.paymentStatus = calculatePaymentStatus(this.amountPaid, this.totalAmount);

    // Check if overdue
    if (this.dueDate && this.amountDue > 0) {
        this.isOverdue = new Date() > this.dueDate;
    }

    next();
});

// Compound indexes
purchaseOrderSchema.index({ companyId: 1, orderDate: -1 });
purchaseOrderSchema.index({ companyId: 1, supplierId: 1, orderDate: -1 });
purchaseOrderSchema.index({ companyId: 1, orderStatus: 1 });
purchaseOrderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
