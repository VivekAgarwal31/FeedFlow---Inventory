import express from 'express';
import DeliveryOut from '../models/DeliveryOut.js';
import DeliveryIn from '../models/DeliveryIn.js';
import StockItem from '../models/StockItem.js';
import { authenticate } from '../middleware/auth.js';
import { generateSalesPDF, generatePurchasePDF, generateInventoryPDF } from '../utils/pdfGenerator.js';
import { generateSalesReportExcel, generatePurchaseReportExcel, generateInventoryReportExcel } from '../utils/dataExport.js';

const router = express.Router();

/**
 * Generate Sales Report - PDF
 */
router.post('/sales/pdf', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientName, paymentStatus } = req.body;

        // Build query
        const query = { companyId };

        if (startDate || endDate) {
            query.deliveryDate = {};
            if (startDate) query.deliveryDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.deliveryDate.$lte = end;
            }
        }

        if (clientName) {
            query.clientName = clientName;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Fetch delivery data
        const sales = await DeliveryOut.find(query).sort({ deliveryDate: -1 }).lean();

        // Generate PDF
        const pdfBuffer = await generateSalesPDF(sales, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `sales_report_${dateStr}_${Date.now()}.pdf`;

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate sales PDF error:', error);
        res.status(500).json({ message: 'Error generating sales report', error: error.message });
    }
});

/**
 * Generate Sales Report - Excel
 */
router.post('/sales/excel', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientName, paymentStatus } = req.body;

        // Build query
        const query = { companyId };

        if (startDate || endDate) {
            query.deliveryDate = {};
            if (startDate) query.deliveryDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.deliveryDate.$lte = end;
            }
        }

        if (clientName) {
            query.clientName = clientName;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Fetch delivery data
        const sales = await DeliveryOut.find(query).sort({ deliveryDate: -1 }).lean();

        // Generate Excel
        const excelBuffer = await generateSalesReportExcel(sales, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `sales_report_${dateStr}_${Date.now()}.xlsx`;

        // Send Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate sales Excel error:', error);
        res.status(500).json({ message: 'Error generating sales report', error: error.message });
    }
});

/**
 * Generate Purchase Report - PDF
 */
router.post('/purchases/pdf', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierName, paymentStatus } = req.body;

        // Build query
        const query = { companyId };

        if (startDate || endDate) {
            query.receiptDate = {};
            if (startDate) query.receiptDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.receiptDate.$lte = end;
            }
        }

        if (supplierName) {
            query.supplierName = supplierName;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Fetch delivery data
        const purchases = await DeliveryIn.find(query).sort({ receiptDate: -1 }).lean();

        // Generate PDF
        const pdfBuffer = await generatePurchasePDF(purchases, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `purchase_report_${dateStr}_${Date.now()}.pdf`;

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate purchase PDF error:', error);
        res.status(500).json({ message: 'Error generating purchase report', error: error.message });
    }
});

/**
 * Generate Purchase Report - Excel
 */
router.post('/purchases/excel', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierName, paymentStatus } = req.body;

        // Build query
        const query = { companyId };

        if (startDate || endDate) {
            query.receiptDate = {};
            if (startDate) query.receiptDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.receiptDate.$lte = end;
            }
        }

        if (supplierName) {
            query.supplierName = supplierName;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Fetch delivery data
        const purchases = await DeliveryIn.find(query).sort({ receiptDate: -1 }).lean();

        // Generate Excel
        const excelBuffer = await generatePurchaseReportExcel(purchases, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `purchase_report_${dateStr}_${Date.now()}.xlsx`;

        // Send Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate purchase Excel error:', error);
        res.status(500).json({ message: 'Error generating purchase report', error: error.message });
    }
});

/**
 * Generate Inventory Report - PDF
 */
router.post('/inventory/pdf', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { warehouseId, category } = req.body;

        // Build query
        const query = { companyId };

        if (warehouseId) {
            query.warehouseId = warehouseId;
        }

        if (category) {
            query.category = category;
        }

        // Fetch stock items with warehouse information
        const stockItems = await StockItem.find(query)
            .populate('warehouseId', 'name')
            .sort({ itemName: 1 })
            .lean();

        // Generate PDF
        const pdfBuffer = await generateInventoryPDF(stockItems, req.user.companyId, { warehouseId, category });

        // Generate filename
        const filename = `inventory_report_${Date.now()}.pdf`;

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate inventory PDF error:', error);
        res.status(500).json({ message: 'Error generating inventory report', error: error.message });
    }
});

/**
 * Generate Inventory Report - Excel
 */
router.post('/inventory/excel', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { warehouseId, category } = req.body;

        // Build query
        const query = { companyId };

        if (warehouseId) {
            query.warehouseId = warehouseId;
        }

        if (category) {
            query.category = category;
        }

        // Fetch stock items with warehouse information
        const stockItems = await StockItem.find(query)
            .populate('warehouseId', 'name')
            .sort({ itemName: 1 })
            .lean();

        // Generate Excel
        const excelBuffer = await generateInventoryReportExcel(stockItems, req.user.companyId, { warehouseId, category });

        // Generate filename
        const filename = `inventory_report_${Date.now()}.xlsx`;

        // Send Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate inventory Excel error:', error);
        res.status(500).json({ message: 'Error generating inventory report', error: error.message });
    }
});

export default router;
