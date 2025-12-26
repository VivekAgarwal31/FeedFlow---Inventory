import mongoose from 'mongoose';

const paymentReminderSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    clientEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    clientPhone: {
        type: String,
        trim: true
    },
    amountDue: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    reminderType: {
        type: String,
        enum: ['before_due', 'on_due', 'after_due'],
        required: true
    },
    reminderDate: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    sentAt: {
        type: Date
    },
    method: {
        type: String,
        enum: ['email', 'notification', 'sms'],
        default: 'notification'
    },
    message: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
paymentReminderSchema.index({ companyId: 1, status: 1, reminderDate: 1 }); // Pending reminders
paymentReminderSchema.index({ companyId: 1, invoiceId: 1 }); // Invoice reminders

export default mongoose.model('PaymentReminder', paymentReminderSchema);
