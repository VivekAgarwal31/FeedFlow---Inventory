import mongoose from 'mongoose';

const weeklyReportLogSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    weekStartDate: {
        type: Date,
        required: true
    },
    weekEndDate: {
        type: Date,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    recipients: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        email: String,
        role: String
    }],
    metrics: {
        totalProducts: Number,
        lowStockItems: Number,
        outOfStockItems: Number,
        // Direct mode metrics
        directSalesCount: Number,
        directPurchasesCount: Number,
        // Order mode metrics
        salesOrdersCount: Number,
        purchaseOrdersCount: Number,
        deliveriesOutCount: Number,
        deliveriesInCount: Number,
        // Common
        stockMovementsCount: Number
    },
    deliveryMode: {
        type: String,
        enum: ['direct', 'order'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        default: 'sent'
    },
    errorMessage: String,
    pdfGenerated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for querying reports by company and week
weeklyReportLogSchema.index({ companyId: 1, weekStartDate: 1 });

export default mongoose.model('WeeklyReportLog', weeklyReportLogSchema);
