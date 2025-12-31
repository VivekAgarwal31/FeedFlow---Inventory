import mongoose from 'mongoose';
// AUDIT FIX - TASK 3: Import shared payment calculation utilities
import { calculatePaymentStatus, calculateAmountDue } from '../utils/paymentCalculations.js';

const salesOrderItemSchema = new mongoose.Schema({
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
    deliveredQuantity: {
        type: Number,
        default: 0,
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

const salesOrderSchema = new mongoose.Schema({
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
    items: [salesOrderItemSchema],
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
    orderStatus: {
        type: String,
        enum: ['pending', 'partially_delivered', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Payment and invoicing fields
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
    // Delivery tracking
    linkedDeliveries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryOut'
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

// Update order status based on delivered quantities
salesOrderSchema.methods.updateOrderStatus = function () {
    let totalOrdered = 0;
    let totalDelivered = 0;

    this.items.forEach(item => {
        totalOrdered += item.quantity;
        totalDelivered += item.deliveredQuantity;
    });

    if (totalDelivered === 0) {
        this.orderStatus = 'pending';
    } else if (totalDelivered >= totalOrdered) {
        this.orderStatus = 'completed';
    } else {
        this.orderStatus = 'partially_delivered';
    }
};

// AUDIT FIX - TASK 3: Use shared payment calculation utilities
// Calculate amount due before saving
salesOrderSchema.pre('save', function (next) {
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
salesOrderSchema.index({ companyId: 1, orderDate: -1 });
salesOrderSchema.index({ companyId: 1, clientName: 1 });
salesOrderSchema.index({ companyId: 1, orderStatus: 1 });
salesOrderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });

export default mongoose.model('SalesOrder', salesOrderSchema);
