import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
    sNo: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    weightInKgs: {
        type: Number,
        min: 0
    },
    rate: {
        type: Number,
        required: true,
        min: 0
    },
    per: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    invoiceNumber: {
        type: Number,
        required: true
    },
    invoiceDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    clientDetails: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
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
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true
        }
    },
    companyDetails: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        proprietor: {
            type: String,
            trim: true
        },
        address: {
            type: String,
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
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true
        }
    },
    deliveryNote: {
        type: String,
        trim: true
    },
    supplierRef: {
        type: String,
        trim: true
    },
    buyerOrderNo: {
        type: String,
        trim: true
    },
    buyerOrderDate: {
        type: Date
    },
    despatchDocNo: {
        type: String,
        trim: true
    },
    despatchDocDate: {
        type: Date
    },
    despatchedThrough: {
        type: String,
        trim: true
    },
    destination: {
        type: String,
        trim: true
    },
    termsOfDelivery: {
        type: String,
        trim: true
    },
    items: [invoiceItemSchema],
    totalQuantity: {
        type: String,
        trim: true
    },
    wages: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    amountInWords: {
        type: String,
        trim: true
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    amountDue: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending', 'overdue'],
        default: 'pending'
    },
    declaration: {
        type: String,
        trim: true,
        default: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'
    },
    authorizedSignatory: {
        type: String,
        trim: true
    },
    pdfPath: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true }); // Unique invoice lookup
invoiceSchema.index({ companyId: 1, saleId: 1 }); // Link to sale
invoiceSchema.index({ companyId: 1, paymentStatus: 1, invoiceDate: 1 }); // Overdue invoices
invoiceSchema.index({ companyId: 1, clientId: 1, invoiceDate: -1 }); // Client invoices

// Calculate amount due before saving
invoiceSchema.pre('save', function (next) {
    this.amountDue = this.totalAmount - this.amountPaid;

    // Update payment status
    if (this.amountPaid === 0) {
        this.paymentStatus = 'pending';
    } else if (this.amountPaid >= this.totalAmount) {
        this.paymentStatus = 'paid';
    } else {
        this.paymentStatus = 'partial';
    }

    next();
});

export default mongoose.model('Invoice', invoiceSchema);
