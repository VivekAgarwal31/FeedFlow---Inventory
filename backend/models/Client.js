import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Analytics fields
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalRevenue: {
        type: Number,
        default: 0,
        min: 0
    },
    lastPurchaseDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound indexes for queries
clientSchema.index({ companyId: 1, isActive: 1 });
clientSchema.index({ companyId: 1, totalRevenue: -1 }); // Top clients

// Ensure client names are unique within a company
clientSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default mongoose.model('Client', clientSchema);
