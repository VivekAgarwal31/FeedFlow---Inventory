import mongoose from 'mongoose';

const archiveMetadataSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    entityType: {
        type: String,
        required: true,
        enum: ['stockTransactions', 'sales', 'purchases']
    },
    recordCount: {
        type: Number,
        required: true,
        default: 0
    },
    cutoffDate: {
        type: Date,
        required: true
    },
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index for queries
archiveMetadataSchema.index({ companyId: 1, entityType: 1, createdAt: -1 });

export default mongoose.model('ArchiveMetadata', archiveMetadataSchema);
