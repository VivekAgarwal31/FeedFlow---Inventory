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
        enum: ['delivery_in', 'delivery_out', 'stock_move', 'stock_adjust'],
        required: true,
        index: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockItem'
    },
    itemName: {
        type: String
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    warehouseName: {
        type: String
    },
    // For aggregated delivery transactions
    items: {
        type: Number  // Count of items in delivery
    },
    warehouses: {
        type: Number  // Count of warehouses involved
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
    // For multi-item transactions (stock in/out/move/adjust with multiple items)
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StockItem'
        },
        itemName: String,
        quantity: Number,
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        },
        warehouseName: String,
        // For stock adjust - track adjustment type per item
        adjustmentType: {
            type: String,
            enum: ['increase', 'decrease']
        }
    }],
    // Reference to related documents
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel'
    },
    referenceModel: {
        type: String,
        enum: ['DeliveryOut', 'DeliveryIn', 'Sale', 'Purchase']
    },
    reason: {
        type: String,
        trim: true
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
