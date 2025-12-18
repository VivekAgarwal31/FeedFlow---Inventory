import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true // Index for fast company-based queries
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        min: 0,
        default: 0
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Ensure warehouse names are unique within a company
warehouseSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.model('Warehouse', warehouseSchema);
