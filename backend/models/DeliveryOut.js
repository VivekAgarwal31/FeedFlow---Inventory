import mongoose from 'mongoose';

const deliveryOutItemSchema = new mongoose.Schema({
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

const deliveryOutSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    deliveryNumber: {
        type: Number,
        required: true,
        index: true
    },
    salesOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesOrder',
        index: true
    },
    salesOrderNumber: {
        type: Number
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
    items: [deliveryOutItemSchema],
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
    deliveryDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    deliveryStatus: {
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
deliveryOutSchema.index({ companyId: 1, deliveryDate: -1 });
deliveryOutSchema.index({ companyId: 1, clientName: 1 });
deliveryOutSchema.index({ companyId: 1, salesOrderId: 1 });
deliveryOutSchema.index({ companyId: 1, deliveryNumber: 1 }, { unique: true });

export default mongoose.model('DeliveryOut', deliveryOutSchema);
