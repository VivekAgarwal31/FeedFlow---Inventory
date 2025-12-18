import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['stock_in', 'stock_out', 'stock_move', 'stock_adjust', 'purchase', 'sale'],
        required: true,
        index: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockItem',
        required: true,
        index: true
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
    // For stock moves
    toWarehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    toWarehouseName: {
        type: String
    },
    quantity: {
        type: Number,
        required: true
    },
    // Reference to related documents
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel'
    },
    referenceModel: {
        type: String,
        enum: ['Sale', 'Purchase']
    },
    reason: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
stockTransactionSchema.index({ companyId: 1, transactionDate: -1 }); // Recent transactions
stockTransactionSchema.index({ companyId: 1, type: 1, transactionDate: -1 }); // Type-based queries
stockTransactionSchema.index({ companyId: 1, itemId: 1, transactionDate: -1 }); // Item history
stockTransactionSchema.index({ companyId: 1, warehouseId: 1 }); // Warehouse transactions

export default mongoose.model('StockTransaction', stockTransactionSchema);
