import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    couponCode: {
        type: String,
        required: true,
        uppercase: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null
    },
    planId: {
        type: String,
        required: true
    },
    originalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    finalAmount: {
        type: Number,
        required: true
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast lookups
couponUsageSchema.index({ couponId: 1 });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ companyId: 1 });
couponUsageSchema.index({ appliedAt: -1 });

// Compound index for checking user-specific usage
couponUsageSchema.index({ couponId: 1, userId: 1 });

export default mongoose.model('CouponUsage', couponUsageSchema);
