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
    totalAmount: {
        type: Number,
        required: true,
        min: 0
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
    saleDate: {
        type: Date,
        default: Date.now,
        index: true // Index for date-based queries
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
saleSchema.index({ companyId: 1, saleDate: -1 }); // Recent sales
saleSchema.index({ companyId: 1, clientName: 1 }); // Client-based queries
saleSchema.index({ companyId: 1, paymentStatus: 1 }); // Payment status queries

export default mongoose.model('Sale', saleSchema);
