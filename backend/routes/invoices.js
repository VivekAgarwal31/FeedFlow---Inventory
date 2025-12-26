import express from 'express';
import Invoice from '../models/Invoice.js';
import Sale from '../models/Sale.js';
import Company from '../models/Company.js';
import Client from '../models/Client.js';
import { authenticate } from '../middleware/auth.js';
import { generateInvoicePDF, calculateTotalQuantity } from '../utils/invoiceGenerator.js';
import numberToWords from '../utils/numberToWords.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Generate invoice for a sale
router.post('/generate/:saleId', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId);

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Verify company ownership
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        if (sale.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if invoice already exists
        let invoice = await Invoice.findOne({ saleId: sale._id });

        if (invoice) {
            return res.json({
                message: 'Invoice already exists',
                invoice,
                existing: true
            });
        }

        // Get company details
        const company = await Company.findById(userCompanyId);

        // Get client details if available
        let clientDetails = {
            name: sale.clientName,
            address: '',
            phone: sale.clientPhone || '',
            email: sale.clientEmail || '',
            gstNumber: ''
        };

        if (sale.clientId) {
            const client = await Client.findById(sale.clientId);
            if (client) {
                clientDetails = {
                    name: client.name,
                    address: client.address || '',
                    phone: client.phone || '',
                    email: client.email || '',
                    gstNumber: client.gstNumber || ''
                };
            }
        }

        // Get next invoice number
        const lastInvoice = await Invoice.findOne({ companyId: userCompanyId })
            .sort({ invoiceNumber: -1 });
        const nextInvoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;

        // Prepare invoice items from sale items
        const invoiceItems = sale.items.map((item, index) => ({
            sNo: index + 1,
            description: item.itemName,
            quantity: item.quantity,
            unit: 'BAGS', // Default unit, can be customized
            weightInKgs: item.quantity * 50, // Estimate, can be customized
            rate: item.sellingPrice,
            per: 'BAG',
            amount: item.total
        }));

        // Calculate total quantity
        const totalQuantity = calculateTotalQuantity(invoiceItems);

        // Create invoice
        invoice = new Invoice({
            companyId: userCompanyId,
            invoiceNumber: nextInvoiceNumber,
            invoiceDate: req.body.invoiceDate || sale.saleDate || new Date(),
            saleId: sale._id,
            clientId: sale.clientId,
            clientDetails,
            companyDetails: {
                name: company.name,
                proprietor: company.proprietorName || req.user.fullName,
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                gstNumber: company.gstNumber || ''
            },
            deliveryNote: req.body.deliveryNote || 'Cash',
            supplierRef: req.body.supplierRef || '',
            buyerOrderNo: req.body.buyerOrderNo || '',
            buyerOrderDate: req.body.buyerOrderDate || null,
            despatchDocNo: req.body.despatchDocNo || '',
            despatchDocDate: req.body.despatchDocDate || null,
            despatchedThrough: req.body.despatchedThrough || '',
            destination: req.body.destination || clientDetails.address,
            termsOfDelivery: req.body.termsOfDelivery || '',
            items: invoiceItems,
            totalQuantity,
            wages: sale.wages || 0,
            totalAmount: sale.totalAmount,
            amountInWords: numberToWords(sale.totalAmount),
            amountPaid: sale.amountPaid || 0,
            amountDue: sale.amountDue || sale.totalAmount,
            paymentStatus: sale.paymentStatus,
            authorizedSignatory: req.user.fullName
        });

        await invoice.save();

        // Update sale with invoice number and date
        sale.invoiceNumber = nextInvoiceNumber;
        sale.invoiceDate = invoice.invoiceDate;
        if (!sale.dueDate && sale.paymentTerms) {
            // Calculate due date based on payment terms (e.g., "Net 30" = 30 days)
            const days = parseInt(sale.paymentTerms.match(/\d+/)?.[0] || '30');
            sale.dueDate = new Date(invoice.invoiceDate);
            sale.dueDate.setDate(sale.dueDate.getDate() + days);
        }
        await sale.save();

        res.status(201).json({
            message: 'Invoice generated successfully',
            invoice
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Download invoice PDF
router.get('/download/:invoiceNumber', async (req, res) => {
    try {
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        const invoice = await Invoice.findOne({
            companyId: userCompanyId,
            invoiceNumber: parseInt(req.params.invoiceNumber)
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Generate PDF
        const doc = generateInvoicePDF(invoice.toObject());

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Download invoice PDF by sale ID (for direct download from sales page)
router.get('/download-by-sale/:saleId', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId);

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Verify company ownership
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        if (sale.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find or generate invoice
        let invoice = await Invoice.findOne({ saleId: sale._id });

        if (!invoice) {
            // Auto-generate invoice if it doesn't exist
            // Get company details
            const company = await Company.findById(userCompanyId);

            // Get client details
            let clientDetails = {
                name: sale.clientName,
                address: '',
                phone: sale.clientPhone || '',
                email: sale.clientEmail || '',
                gstNumber: ''
            };

            if (sale.clientId) {
                const client = await Client.findById(sale.clientId);
                if (client) {
                    clientDetails = {
                        name: client.name,
                        address: client.address || '',
                        phone: client.phone || '',
                        email: client.email || '',
                        gstNumber: client.gstNumber || ''
                    };
                }
            }

            // Get next invoice number
            const lastInvoice = await Invoice.findOne({ companyId: userCompanyId })
                .sort({ invoiceNumber: -1 });
            const nextInvoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;

            // Prepare invoice items
            const invoiceItems = sale.items.map((item, index) => ({
                sNo: index + 1,
                description: item.itemName,
                quantity: item.quantity,
                unit: 'BAGS',
                weightInKgs: item.quantity * 50,
                rate: item.sellingPrice,
                per: 'BAG',
                amount: item.total
            }));

            const totalQuantity = calculateTotalQuantity(invoiceItems);

            invoice = new Invoice({
                companyId: userCompanyId,
                invoiceNumber: nextInvoiceNumber,
                invoiceDate: sale.saleDate || new Date(),
                saleId: sale._id,
                clientId: sale.clientId,
                clientDetails,
                companyDetails: {
                    name: company.name,
                    proprietor: company.proprietorName || req.user.fullName,
                    address: company.address || '',
                    phone: company.phone || '',
                    email: company.email || '',
                    gstNumber: company.gstNumber || ''
                },
                deliveryNote: 'Cash',
                items: invoiceItems,
                totalQuantity,
                wages: sale.wages || 0,
                totalAmount: sale.totalAmount,
                amountInWords: numberToWords(sale.totalAmount),
                amountPaid: sale.amountPaid || 0,
                amountDue: sale.amountDue || sale.totalAmount,
                paymentStatus: sale.paymentStatus,
                authorizedSignatory: req.user.fullName
            });

            await invoice.save();

            // Update sale
            sale.invoiceNumber = nextInvoiceNumber;
            sale.invoiceDate = invoice.invoiceDate;
            await sale.save();
        }

        // Generate PDF
        const doc = generateInvoicePDF(invoice.toObject());

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get invoice by invoice number
router.get('/:invoiceNumber', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            companyId: req.user.companyId,
            invoiceNumber: parseInt(req.params.invoiceNumber)
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get invoice for a sale
router.get('/sale/:saleId', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            companyId: req.user.companyId,
            saleId: req.params.saleId
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found for this sale' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all invoices with filters
router.get('/', async (req, res) => {
    try {
        const { status, clientId, startDate, endDate, page = 1, limit = 50 } = req.query;

        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        const query = { companyId: userCompanyId };

        if (status) query.paymentStatus = status;
        if (clientId) query.clientId = clientId;

        if (startDate || endDate) {
            query.invoiceDate = {};
            if (startDate) query.invoiceDate.$gte = new Date(startDate);
            if (endDate) query.invoiceDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const invoices = await Invoice.find(query)
            .sort({ invoiceNumber: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update invoice terms
router.put('/:id/terms', async (req, res) => {
    try {
        const { terms, dueDate, deliveryNote, supplierRef, buyerOrderNo, buyerOrderDate,
            despatchDocNo, despatchDocDate, despatchedThrough, destination, termsOfDelivery } = req.body;

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Verify company ownership
        const userCompanyId = req.user.companyId?._id || req.user.companyId;
        if (invoice.companyId.toString() !== userCompanyId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        if (deliveryNote !== undefined) invoice.deliveryNote = deliveryNote;
        if (supplierRef !== undefined) invoice.supplierRef = supplierRef;
        if (buyerOrderNo !== undefined) invoice.buyerOrderNo = buyerOrderNo;
        if (buyerOrderDate !== undefined) invoice.buyerOrderDate = buyerOrderDate;
        if (despatchDocNo !== undefined) invoice.despatchDocNo = despatchDocNo;
        if (despatchDocDate !== undefined) invoice.despatchDocDate = despatchDocDate;
        if (despatchedThrough !== undefined) invoice.despatchedThrough = despatchedThrough;
        if (destination !== undefined) invoice.destination = destination;
        if (termsOfDelivery !== undefined) invoice.termsOfDelivery = termsOfDelivery;

        await invoice.save();

        res.json({
            message: 'Invoice updated successfully',
            invoice
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
