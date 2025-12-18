import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['raw_material', 'finished_product', 'packaging'],
    default: 'finished_product'
  },
  itemCategory: {
    type: String,
    trim: true,
    default: ''
  },
  bagSize: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockAlert: {
    type: Number,
    default: 10,
    min: 0
  }
}, {
  timestamps: true
});

// Virtual for stock status
stockItemSchema.virtual('status').get(function() {
  return this.quantity <= this.lowStockAlert ? 'low_stock' : 'in_stock';
});

// Ensure virtual fields are serialized
stockItemSchema.set('toJSON', { virtuals: true });

export default mongoose.model('StockItem', stockItemSchema);
