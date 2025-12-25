import mongoose from 'mongoose';

const backupMetadataSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    backupId: {
        type: String,
        required: true,
        unique: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    recordCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    status: {
        type: String,
        enum: ['completed', 'failed', 'deleted'],
        default: 'completed'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiresAt: {
        type: Date,
        index: true
    }
}, {
    timestamps: true
});

// Index for cleanup queries
backupMetadataSchema.index({ companyId: 1, createdAt: -1 });
backupMetadataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('BackupMetadata', backupMetadataSchema);
