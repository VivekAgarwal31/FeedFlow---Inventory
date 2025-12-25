import mongoose from 'mongoose';

const cleanupLogSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    cleanupType: {
        type: String,
        required: true,
        enum: ['orphans', 'duplicates', 'optimize']
    },
    recordsAffected: {
        type: Number,
        default: 0
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for queries
cleanupLogSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model('CleanupLog', cleanupLogSchema);
