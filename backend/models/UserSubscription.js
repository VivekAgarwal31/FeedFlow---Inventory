import mongoose from 'mongoose';

const userSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    trial: {
        isTrial: {
            type: Boolean,
            default: false
        },
        startedAt: {
            type: Date,
            default: null
        },
        endsAt: {
            type: Date,
            default: null
        }
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null // null means no expiry
    },
    updatedByAdmin: {
        type: Boolean,
        default: false
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for efficient queries
userSubscriptionSchema.index({ userId: 1 });
userSubscriptionSchema.index({ status: 1 });
userSubscriptionSchema.index({ 'trial.endsAt': 1 });

// Method to check if subscription is active
userSubscriptionSchema.methods.isActive = function () {
    if (this.status !== 'active') return false;

    // Check if expired
    if (this.expiresAt && this.expiresAt < new Date()) {
        return false;
    }

    return true;
};

// Method to check if trial has expired
userSubscriptionSchema.methods.isTrialExpired = function () {
    if (!this.trial.isTrial) return false;
    if (!this.trial.endsAt) return false;

    return this.trial.endsAt < new Date();
};

// Static method to create trial subscription
userSubscriptionSchema.statics.createTrialSubscription = async function (userId, trialPlanId) {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 days from now

    return await this.create({
        userId,
        planId: trialPlanId,
        status: 'active',
        trial: {
            isTrial: true,
            startedAt: now,
            endsAt: trialEnd
        },
        startedAt: now,
        expiresAt: trialEnd
    });
};

// Static method to downgrade expired trials to free plan
userSubscriptionSchema.statics.downgradeExpiredTrials = async function (freePlanId) {
    const now = new Date();

    const expiredTrials = await this.find({
        'trial.isTrial': true,
        'trial.endsAt': { $lte: now },
        status: 'active'
    });

    const results = {
        processed: 0,
        downgraded: []
    };

    for (const subscription of expiredTrials) {
        subscription.planId = freePlanId;
        subscription.status = 'active';
        subscription.trial.isTrial = false;
        subscription.expiresAt = null; // Free plan never expires
        await subscription.save();

        results.processed++;
        results.downgraded.push(subscription.userId);
    }

    return results;
};

export default mongoose.model('UserSubscription', userSubscriptionSchema);
