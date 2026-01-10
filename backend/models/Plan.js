import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Free', 'Trial', 'Paid']
    },
    type: {
        type: String,
        required: true,
        enum: ['free', 'trial', 'paid']
    },
    durationDays: {
        type: Number,
        default: null // null means unlimited
    },
    features: {
        maxWarehouses: {
            type: Number,
            default: null // null means unlimited
        },
        maxItems: {
            type: Number,
            default: null // null means unlimited
        },
        backupAccess: {
            type: Boolean,
            default: false
        },
        reportsAccess: {
            type: Boolean,
            default: false
        },
        accountingAccess: {
            type: Boolean,
            default: false
        },
        advancedInventory: {
            type: Boolean,
            default: false
        }
    },
    price: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Static method to get plan by type
planSchema.statics.getByType = async function (type) {
    return await this.findOne({ type, isActive: true });
};

// Static method to initialize default plans
planSchema.statics.initializePlans = async function () {
    const plans = [
        {
            name: 'Free',
            type: 'free',
            durationDays: null,
            features: {
                maxWarehouses: 2,
                maxItems: 5,
                backupAccess: false,
                reportsAccess: false,
                accountingAccess: false,
                advancedInventory: false
            },
            price: 0,
            isActive: true
        },
        {
            name: 'Trial',
            type: 'trial',
            durationDays: 14,
            features: {
                maxWarehouses: null,
                maxItems: null,
                backupAccess: false, // Backup is Paid-only
                reportsAccess: true,
                accountingAccess: true,
                advancedInventory: true
            },
            price: 0,
            isActive: true
        },
        {
            name: 'Paid',
            type: 'paid',
            durationDays: null,
            features: {
                maxWarehouses: null,
                maxItems: null,
                backupAccess: true,
                reportsAccess: true,
                accountingAccess: true,
                advancedInventory: true
            },
            price: 999,
            isActive: true
        }
    ];

    for (const planData of plans) {
        await this.findOneAndUpdate(
            { type: planData.type },
            planData,
            { upsert: true, new: true }
        );
    }
};

export default mongoose.model('Plan', planSchema);
