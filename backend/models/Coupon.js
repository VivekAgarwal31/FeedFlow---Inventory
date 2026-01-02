import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 4,
        maxlength: 20,
        match: /^[A-Z0-9]+$/ // Alphanumeric only
    },
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'flat', 'free_plan']
    },
    value: {
        type: Number,
        required: function () {
            return this.type !== 'free_plan';
        },
        min: 0
    },
    applicablePlans: [{
        type: String,
        enum: ['trial', 'paid']
    }],
    expiryDate: {
        type: Date,
        default: null
    },
    usageLimit: {
        total: {
            type: Number,
            default: null // null = unlimited
        },
        perUser: {
            type: Boolean,
            default: false // false = global limit, true = per user limit
        }
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for fast lookups (code already indexed via unique: true)
couponSchema.index({ isActive: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
    if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };

    if (this.expiryDate && new Date() > this.expiryDate) {
        return { valid: false, reason: 'Coupon has expired' };
    }

    if (this.usageLimit.total !== null && this.usedCount >= this.usageLimit.total) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }

    return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (originalAmount) {
    if (this.type === 'free_plan') {
        return originalAmount; // 100% discount
    } else if (this.type === 'percentage') {
        return Math.min(originalAmount, (originalAmount * this.value) / 100);
    } else if (this.type === 'flat') {
        return Math.min(originalAmount, this.value);
    }
    return 0;
};

export default mongoose.model('Coupon', couponSchema);
