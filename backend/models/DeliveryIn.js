import mongoose from 'mongoose';

const deliveryInItemSchema = new mongoose.Schema({
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

const deliveryInSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    grnNumber: {
        type: Number,
        required: true,
        index: true
    },
    purchaseOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder',
        index: true
    },
    purchaseOrderNumber: {
        type: Number
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
    items: [deliveryInItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    receiptDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    receiptStatus: {
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

// Compound indexes
deliveryInSchema.index({ companyId: 1, receiptDate: -1 });
deliveryInSchema.index({ companyId: 1, supplierId: 1, receiptDate: -1 });
deliveryInSchema.index({ companyId: 1, purchaseOrderId: 1 });
deliveryInSchema.index({ companyId: 1, grnNumber: 1 }, { unique: true });

export default mongoose.model('DeliveryIn', deliveryInSchema);
