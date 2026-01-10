import mongoose from 'mongoose';

const restoreLogSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    backupId: {
        type: String,
        required: true
    },
    restoreType: {
        type: String,
        enum: ['partial', 'full'],
        required: true
    },
    modulesRestored: [{
        type: String
    }],
    recordsRestored: {
        stockItems: { type: Number, default: 0 },
        sales: { type: Number, default: 0 },
        purchases: { type: Number, default: 0 },
        clients: { type: Number, default: 0 },
        suppliers: { type: Number, default: 0 },
        warehouses: { type: Number, default: 0 },
        stockTransactions: { type: Number, default: 0 },
        users: { type: Number, default: 0 },
        salesOrders: { type: Number, default: 0 },
        purchaseOrders: { type: Number, default: 0 },
        deliveryOuts: { type: Number, default: 0 },
        deliveryIns: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['success', 'partial', 'failed'],
        default: 'success'
    },
    errorMessage: {
        type: String
    },
    restoredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restoredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for restore history queries
restoreLogSchema.index({ companyId: 1, restoredAt: -1 });

export default mongoose.model('RestoreLog', restoreLogSchema);
