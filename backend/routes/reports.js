import express from 'express';
import DeliveryOut from '../models/DeliveryOut.js';
import DeliveryIn from '../models/DeliveryIn.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DirectSale from '../models/DirectSale.js';
import DirectPurchase from '../models/DirectPurchase.js';
import StockItem from '../models/StockItem.js';
import { authenticate } from '../middleware/auth.js';
import { checkReportsAccess } from '../middleware/subscriptionMiddleware.js';
import { requirePermission } from '../middleware/rbac.js';
import { generateSalesPDF, generatePurchasePDF, generateInventoryPDF, generateClientReportPDF, generateSupplierReportPDF } from '../utils/pdfGenerator.js';
import { generateSalesReportExcel, generatePurchaseReportExcel, generateInventoryReportExcel, generateClientReportExcel, generateSupplierReportExcel } from '../utils/dataExport.js';

const router = express.Router();

/**
 * Generate Sales Report - PDF
 */
router.post('/sales/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId, clientName, paymentStatus } = req.body;

        // Build query for SalesOrder
        const orderQuery = { companyId };
        if (startDate || endDate) {
            orderQuery.orderDate = {};
            if (startDate) orderQuery.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                orderQuery.orderDate.$lte = end;
            }
        }
        if (clientId) {
            orderQuery.clientId = clientId;
        } else if (clientName) {
            orderQuery.clientName = clientName;
        }
        if (paymentStatus) {
            orderQuery.paymentStatus = paymentStatus;
        }

        // Build query for DirectSale
        const directQuery = { companyId };
        if (startDate || endDate) {
            directQuery.saleDate = {};
            if (startDate) directQuery.saleDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                directQuery.saleDate.$lte = end;
            }
        }
        if (clientId) {
            directQuery.clientId = clientId;
        } else if (clientName) {
            directQuery.clientName = clientName;
        }
        if (paymentStatus) {
            directQuery.paymentStatus = paymentStatus;
        }

        // Fetch both SalesOrder and DirectSale data
        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find(orderQuery).sort({ orderDate: -1 }).lean(),
            DirectSale.find(directQuery).sort({ saleDate: -1 }).lean()
        ]);

        // Transform SalesOrder data
        const orderSales = salesOrders.map(order => {
            const itemsText = order.items && order.items.length > 0
                ? order.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                saleDate: order.orderDate,
                clientName: order.clientName || 'N/A',
                staffName: order.staffName || 'N/A',
                items: itemsText,
                totalAmount: order.totalAmount || 0,
                paymentStatus: order.paymentStatus || 'pending',
                paidAmount: order.amountPaid || 0,
                pendingAmount: order.amountDue || 0
            };
        });

        // Transform DirectSale data
        const directSalesData = directSales.map(sale => {
            const itemsText = sale.items && sale.items.length > 0
                ? sale.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                saleDate: sale.saleDate,
                clientName: sale.clientName || 'N/A',
                staffName: sale.staffName || 'N/A',
                items: itemsText,
                totalAmount: sale.totalAmount || 0,
                paymentStatus: sale.paymentStatus || 'pending',
                paidAmount: sale.amountPaid || 0,
                pendingAmount: (sale.totalAmount - (sale.amountPaid || 0)) || 0
            };
        });

        // Combine and sort by date
        const sales = [...orderSales, ...directSalesData].sort((a, b) =>
            new Date(b.saleDate) - new Date(a.saleDate)
        );

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
router.post('/sales/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId, clientName, paymentStatus } = req.body;

        // Build query for SalesOrder
        const orderQuery = { companyId };
        if (startDate || endDate) {
            orderQuery.orderDate = {};
            if (startDate) orderQuery.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                orderQuery.orderDate.$lte = end;
            }
        }
        if (clientId) {
            orderQuery.clientId = clientId;
        } else if (clientName) {
            orderQuery.clientName = clientName;
        }
        if (paymentStatus) {
            orderQuery.paymentStatus = paymentStatus;
        }

        // Build query for DirectSale
        const directQuery = { companyId };
        if (startDate || endDate) {
            directQuery.saleDate = {};
            if (startDate) directQuery.saleDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                directQuery.saleDate.$lte = end;
            }
        }
        if (clientId) {
            directQuery.clientId = clientId;
        } else if (clientName) {
            directQuery.clientName = clientName;
        }
        if (paymentStatus) {
            directQuery.paymentStatus = paymentStatus;
        }

        // Fetch both SalesOrder and DirectSale data
        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find(orderQuery).sort({ orderDate: -1 }).lean(),
            DirectSale.find(directQuery).sort({ saleDate: -1 }).lean()
        ]);

        // Transform SalesOrder data
        const orderSales = salesOrders.map(order => {
            const itemsText = order.items && order.items.length > 0
                ? order.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                saleDate: order.orderDate,
                clientName: order.clientName || 'N/A',
                staffName: order.staffName || 'N/A',
                items: itemsText,
                totalAmount: order.totalAmount || 0,
                paymentStatus: order.paymentStatus || 'pending',
                paidAmount: order.amountPaid || 0,
                pendingAmount: order.amountDue || 0
            };
        });

        // Transform DirectSale data
        const directSalesData = directSales.map(sale => {
            const itemsText = sale.items && sale.items.length > 0
                ? sale.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                saleDate: sale.saleDate,
                clientName: sale.clientName || 'N/A',
                staffName: sale.staffName || 'N/A',
                items: itemsText,
                totalAmount: sale.totalAmount || 0,
                paymentStatus: sale.paymentStatus || 'pending',
                paidAmount: sale.amountPaid || 0,
                pendingAmount: (sale.totalAmount - (sale.amountPaid || 0)) || 0
            };
        });

        // Combine and sort by date
        const sales = [...orderSales, ...directSalesData].sort((a, b) =>
            new Date(b.saleDate) - new Date(a.saleDate)
        );

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
router.post('/purchases/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId, supplierName, paymentStatus } = req.body;

        // Build query for PurchaseOrder
        const orderQuery = { companyId };
        if (startDate || endDate) {
            orderQuery.orderDate = {};
            if (startDate) orderQuery.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                orderQuery.orderDate.$lte = end;
            }
        }
        if (supplierId) {
            orderQuery.supplierId = supplierId;
        } else if (supplierName) {
            orderQuery.supplierName = supplierName;
        }
        if (paymentStatus) {
            orderQuery.paymentStatus = paymentStatus;
        }

        // Build query for DirectPurchase
        const directQuery = { companyId };
        if (startDate || endDate) {
            directQuery.purchaseDate = {};
            if (startDate) directQuery.purchaseDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                directQuery.purchaseDate.$lte = end;
            }
        }
        if (supplierId) {
            directQuery.supplierId = supplierId;
        } else if (supplierName) {
            directQuery.supplierName = supplierName;
        }
        if (paymentStatus) {
            directQuery.paymentStatus = paymentStatus;
        }

        // Fetch both PurchaseOrder and DirectPurchase data
        const [purchaseOrders, directPurchases] = await Promise.all([
            PurchaseOrder.find(orderQuery).sort({ orderDate: -1 }).lean(),
            DirectPurchase.find(directQuery).sort({ purchaseDate: -1 }).lean()
        ]);

        // Transform PurchaseOrder data
        const orderPurchases = purchaseOrders.map(order => {
            const itemsText = order.items && order.items.length > 0
                ? order.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                purchaseDate: order.orderDate,
                supplierName: order.supplierName || 'N/A',
                staffName: order.staffName || 'N/A',
                items: itemsText,
                totalAmount: order.totalAmount || 0,
                paymentStatus: order.paymentStatus || 'pending',
                paidAmount: order.amountPaid || 0,
                pendingAmount: order.amountDue || 0
            };
        });

        // Transform DirectPurchase data
        const directPurchasesData = directPurchases.map(purchase => {
            const itemsText = purchase.items && purchase.items.length > 0
                ? purchase.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                purchaseDate: purchase.purchaseDate,
                supplierName: purchase.supplierName || 'N/A',
                staffName: purchase.staffName || 'N/A',
                items: itemsText,
                totalAmount: purchase.totalAmount || 0,
                paymentStatus: purchase.paymentStatus || 'pending',
                paidAmount: purchase.amountPaid || 0,
                pendingAmount: (purchase.totalAmount - (purchase.amountPaid || 0)) || 0
            };
        });

        // Combine and sort by date
        const purchases = [...orderPurchases, ...directPurchasesData].sort((a, b) =>
            new Date(b.purchaseDate) - new Date(a.purchaseDate)
        );

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
router.post('/purchases/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId, supplierName, paymentStatus } = req.body;

        // Build query for PurchaseOrder (not DeliveryIn)
        const query = { companyId };

        if (startDate || endDate) {
            query.orderDate = {}; // Use orderDate for PurchaseOrder
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.orderDate.$lte = end;
            }
        }

        // Filter by supplier - prefer ID over name for data integrity
        if (supplierId) {
            query.supplierId = supplierId;
        } else if (supplierName) {
            query.supplierName = supplierName;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Fetch PurchaseOrder data (not DeliveryIn)
        const purchaseOrders = await PurchaseOrder.find(query)
            .sort({ orderDate: -1 })
            .lean();

        // Transform data to match purchase export format
        const purchases = purchaseOrders.map(order => {
            // Format items as "ItemName (Warehouse - Quantity bags)"
            const itemsText = order.items && order.items.length > 0
                ? order.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                purchaseDate: order.orderDate,
                supplierName: order.supplierName || 'N/A',
                staffName: order.staffName || 'N/A',
                items: itemsText,
                totalAmount: order.totalAmount || 0,
                paymentStatus: order.paymentStatus || 'pending',
                paidAmount: order.amountPaid || 0,
                pendingAmount: order.amountDue || 0
            };
        });

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
router.post('/inventory/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
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
router.post('/inventory/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
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

/**
 * Generate Client Report - PDF
 */
router.post('/clients/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId } = req.body;

        if (!clientId) {
            return res.status(400).json({ message: 'Client ID is required for ledger report' });
        }

        // Import Payment model
        const Payment = (await import('../models/Payment.js')).default;
        const Client = (await import('../models/Client.js')).default;

        // Get client details
        const client = await Client.findById(clientId).lean();
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Calculate opening balance (all unpaid transactions before start date)
        const [openingSalesOrders, openingDirectSales] = await Promise.all([
            SalesOrder.find({
                companyId,
                clientId,
                orderDate: { $lt: start },
                paymentStatus: { $in: ['pending', 'partial'] }
            }).lean(),
            DirectSale.find({
                companyId,
                clientId,
                saleDate: { $lt: start },
                paymentStatus: { $in: ['pending', 'partial'] }
            }).lean()
        ]);

        const openingBalance = [
            ...openingSalesOrders.map(o => o.amountDue || (o.totalAmount - (o.amountPaid || 0))),
            ...openingDirectSales.map(s => s.totalAmount - (s.amountPaid || 0))
        ].reduce((sum, amt) => sum + amt, 0);

        // Get all credit sales in date range
        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find({
                companyId,
                clientId,
                orderDate: { $gte: start, $lte: end },
                paymentType: 'credit'
            }).sort({ orderDate: 1 }).lean(),
            DirectSale.find({
                companyId,
                clientId,
                saleDate: { $gte: start, $lte: end },
                paymentType: 'credit'
            }).sort({ saleDate: 1 }).lean()
        ]);

        // Get all payments in date range
        const payments = await Payment.find({
            companyId,
            partyId: clientId,
            partyType: 'client',
            paymentDate: { $gte: start, $lte: end }
        }).sort({ paymentDate: 1 }).lean();

        // Combine all transactions and sort by date
        const transactions = [
            ...salesOrders.map(order => ({
                date: order.orderDate,
                type: 'sale',
                description: `Sale Order #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`,
                debit: order.totalAmount,
                credit: 0,
                balance: 0
            })),
            ...directSales.map(sale => ({
                date: sale.saleDate,
                type: 'sale',
                description: `Direct Sale #${sale.saleNumber || sale._id.toString().slice(-8).toUpperCase()}`,
                debit: sale.totalAmount,
                credit: 0,
                balance: 0
            })),
            ...payments.map(payment => ({
                date: payment.paymentDate,
                type: 'payment',
                description: `Payment - ${payment.paymentMethod} ${payment.referenceNumber ? '(Ref: ' + payment.referenceNumber + ')' : ''}`,
                debit: 0,
                credit: payment.amount,
                balance: 0
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let runningBalance = openingBalance;
        transactions.forEach(txn => {
            runningBalance += txn.debit - txn.credit;
            txn.balance = runningBalance;
        });

        const closingBalance = runningBalance;

        // Prepare ledger data
        const ledgerData = {
            clientName: client.name,
            openingBalance,
            transactions,
            closingBalance,
            totalDebits: transactions.reduce((sum, t) => sum + t.debit, 0),
            totalCredits: transactions.reduce((sum, t) => sum + t.credit, 0)
        };

        // Generate PDF
        const pdfBuffer = await generateClientReportPDF(ledgerData, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `client_ledger_${client.name.replace(/\s+/g, '_')}_${dateStr}_${Date.now()}.pdf`;

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate client PDF error:', error);
        res.status(500).json({ message: 'Error generating client report', error: error.message });
    }
});

/**
 * Generate Client Report - Excel
 */
router.post('/clients/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId } = req.body;

        if (!clientId) {
            return res.status(400).json({ message: 'Client ID is required for ledger report' });
        }

        const Payment = (await import('../models/Payment.js')).default;
        const Client = (await import('../models/Client.js')).default;

        const client = await Client.findById(clientId).lean();
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const [openingSalesOrders, openingDirectSales] = await Promise.all([
            SalesOrder.find({ companyId, clientId, orderDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean(),
            DirectSale.find({ companyId, clientId, saleDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean()
        ]);

        const openingBalance = [
            ...openingSalesOrders.map(o => o.amountDue || (o.totalAmount - (o.amountPaid || 0))),
            ...openingDirectSales.map(s => s.totalAmount - (s.amountPaid || 0))
        ].reduce((sum, amt) => sum + amt, 0);

        const [salesOrders, directSales] = await Promise.all([
            SalesOrder.find({ companyId, clientId, orderDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ orderDate: 1 }).lean(),
            DirectSale.find({ companyId, clientId, saleDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ saleDate: 1 }).lean()
        ]);

        const payments = await Payment.find({ companyId, partyId: clientId, partyType: 'client', paymentDate: { $gte: start, $lte: end } }).sort({ paymentDate: 1 }).lean();

        const transactions = [
            ...salesOrders.map(order => ({ date: order.orderDate, type: 'sale', description: `Sale Order #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`, debit: order.totalAmount, credit: 0, balance: 0 })),
            ...directSales.map(sale => ({ date: sale.saleDate, type: 'sale', description: `Direct Sale #${sale.saleNumber || sale._id.toString().slice(-8).toUpperCase()}`, debit: sale.totalAmount, credit: 0, balance: 0 })),
            ...payments.map(payment => ({ date: payment.paymentDate, type: 'payment', description: `Payment - ${payment.paymentMethod} ${payment.referenceNumber ? '(Ref: ' + payment.referenceNumber + ')' : ''}`, debit: 0, credit: payment.amount, balance: 0 }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = openingBalance;
        transactions.forEach(txn => { runningBalance += txn.debit - txn.credit; txn.balance = runningBalance; });

        const ledgerData = {
            clientName: client.name,
            openingBalance,
            transactions,
            closingBalance: runningBalance,
            totalDebits: transactions.reduce((sum, t) => sum + t.debit, 0),
            totalCredits: transactions.reduce((sum, t) => sum + t.credit, 0)
        };

        const excelBuffer = await generateClientReportExcel(ledgerData, req.user.companyId, { startDate, endDate });
        const dateStr = startDate && endDate ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}` : 'all_time';
        const filename = `client_ledger_${client.name.replace(/\s+/g, '_')}_${dateStr}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate client Excel error:', error);
        res.status(500).json({ message: 'Error generating client report', error: error.message });
    }
});

/**
 * Generate Supplier Report - PDF
 */
router.post('/suppliers/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId } = req.body;

        if (!supplierId) {
            return res.status(400).json({ message: 'Supplier ID is required for ledger report' });
        }

        const Payment = (await import('../models/Payment.js')).default;
        const Supplier = (await import('../models/Supplier.js')).default;

        const supplier = await Supplier.findById(supplierId).lean();
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const [openingPurchaseOrders, openingDirectPurchases] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierId, orderDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean(),
            DirectPurchase.find({ companyId, supplierId, purchaseDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean()
        ]);

        const openingBalance = [
            ...openingPurchaseOrders.map(o => o.amountDue || (o.totalAmount - (o.amountPaid || 0))),
            ...openingDirectPurchases.map(p => p.totalAmount - (p.amountPaid || 0))
        ].reduce((sum, amt) => sum + amt, 0);

        const [purchaseOrders, directPurchases] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierId, orderDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ orderDate: 1 }).lean(),
            DirectPurchase.find({ companyId, supplierId, purchaseDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ purchaseDate: 1 }).lean()
        ]);

        const payments = await Payment.find({ companyId, partyId: supplierId, partyType: 'supplier', paymentDate: { $gte: start, $lte: end } }).sort({ paymentDate: 1 }).lean();

        const transactions = [
            ...purchaseOrders.map(order => ({ date: order.orderDate, type: 'purchase', description: `Purchase Order #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`, debit: order.totalAmount, credit: 0, balance: 0 })),
            ...directPurchases.map(purchase => ({ date: purchase.purchaseDate, type: 'purchase', description: `Direct Purchase #${purchase.purchaseNumber || purchase._id.toString().slice(-8).toUpperCase()}`, debit: purchase.totalAmount, credit: 0, balance: 0 })),
            ...payments.map(payment => ({ date: payment.paymentDate, type: 'payment', description: `Payment - ${payment.paymentMethod} ${payment.referenceNumber ? '(Ref: ' + payment.referenceNumber + ')' : ''}`, debit: 0, credit: payment.amount, balance: 0 }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = openingBalance;
        transactions.forEach(txn => { runningBalance += txn.debit - txn.credit; txn.balance = runningBalance; });

        const ledgerData = {
            supplierName: supplier.name,
            openingBalance,
            transactions,
            closingBalance: runningBalance,
            totalDebits: transactions.reduce((sum, t) => sum + t.debit, 0),
            totalCredits: transactions.reduce((sum, t) => sum + t.credit, 0)
        };

        const pdfBuffer = await generateSupplierReportPDF(ledgerData, req.user.companyId, { startDate, endDate });
        const dateStr = startDate && endDate ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}` : 'all_time';
        const filename = `supplier_ledger_${supplier.name.replace(/\s+/g, '_')}_${dateStr}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate supplier PDF error:', error);
        res.status(500).json({ message: 'Error generating supplier report', error: error.message });
    }
});

/**
 * Generate Supplier Report - Excel
 */
router.post('/suppliers/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId } = req.body;

        if (!supplierId) {
            return res.status(400).json({ message: 'Supplier ID is required for ledger report' });
        }

        const Payment = (await import('../models/Payment.js')).default;
        const Supplier = (await import('../models/Supplier.js')).default;

        const supplier = await Supplier.findById(supplierId).lean();
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const [openingPurchaseOrders, openingDirectPurchases] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierId, orderDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean(),
            DirectPurchase.find({ companyId, supplierId, purchaseDate: { $lt: start }, paymentStatus: { $in: ['pending', 'partial'] } }).lean()
        ]);

        const openingBalance = [
            ...openingPurchaseOrders.map(o => o.amountDue || (o.totalAmount - (o.amountPaid || 0))),
            ...openingDirectPurchases.map(p => p.totalAmount - (p.amountPaid || 0))
        ].reduce((sum, amt) => sum + amt, 0);

        const [purchaseOrders, directPurchases] = await Promise.all([
            PurchaseOrder.find({ companyId, supplierId, orderDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ orderDate: 1 }).lean(),
            DirectPurchase.find({ companyId, supplierId, purchaseDate: { $gte: start, $lte: end }, paymentType: 'credit' }).sort({ purchaseDate: 1 }).lean()
        ]);

        const payments = await Payment.find({ companyId, partyId: supplierId, partyType: 'supplier', paymentDate: { $gte: start, $lte: end } }).sort({ paymentDate: 1 }).lean();

        const transactions = [
            ...purchaseOrders.map(order => ({ date: order.orderDate, type: 'purchase', description: `Purchase Order #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`, debit: order.totalAmount, credit: 0, balance: 0 })),
            ...directPurchases.map(purchase => ({ date: purchase.purchaseDate, type: 'purchase', description: `Direct Purchase #${purchase.purchaseNumber || purchase._id.toString().slice(-8).toUpperCase()}`, debit: purchase.totalAmount, credit: 0, balance: 0 })),
            ...payments.map(payment => ({ date: payment.paymentDate, type: 'payment', description: `Payment - ${payment.paymentMethod} ${payment.referenceNumber ? '(Ref: ' + payment.referenceNumber + ')' : ''}`, debit: 0, credit: payment.amount, balance: 0 }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = openingBalance;
        transactions.forEach(txn => { runningBalance += txn.debit - txn.credit; txn.balance = runningBalance; });

        const ledgerData = {
            supplierName: supplier.name,
            openingBalance,
            transactions,
            closingBalance: runningBalance,
            totalDebits: transactions.reduce((sum, t) => sum + t.debit, 0),
            totalCredits: transactions.reduce((sum, t) => sum + t.credit, 0)
        };

        const excelBuffer = await generateSupplierReportExcel(ledgerData, req.user.companyId, { startDate, endDate });
        const dateStr = startDate && endDate ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}` : 'all_time';
        const filename = `supplier_ledger_${supplier.name.replace(/\s+/g, '_')}_${dateStr}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate supplier Excel error:', error);
        res.status(500).json({ message: 'Error generating supplier report', error: error.message });
    }
});

export default router;

/**
 * Generate Delivery Out Report - PDF
 */
router.post('/deliveries-out/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId, clientName } = req.body;

        // Build query for DeliveryOut
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

        // Filter by client
        if (clientId) {
            query.clientId = clientId;
        } else if (clientName) {
            query.clientName = clientName;
        }

        // Fetch DeliveryOut data
        const deliveries = await DeliveryOut.find(query)
            .sort({ deliveryDate: -1 })
            .lean();

        // Transform data for report
        const deliveryData = deliveries.map(delivery => {
            const itemsText = delivery.items && delivery.items.length > 0
                ? delivery.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                deliveryDate: delivery.deliveryDate,
                deliveryNumber: delivery.deliveryNumber || 'N/A',
                clientName: delivery.clientName || 'N/A',
                staffName: delivery.staffName || 'N/A',
                items: itemsText,
                totalAmount: delivery.totalAmount || 0
            };
        });

        // Generate PDF (reuse sales PDF generator with modified data)
        const pdfBuffer = await generateSalesPDF(deliveryData, req.user.companyId, {
            startDate,
            endDate,
            reportTitle: 'Delivery Out Report'
        });

        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `delivery_out_report_${dateStr}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate delivery out PDF error:', error);
        res.status(500).json({ message: 'Error generating delivery out report', error: error.message });
    }
});

/**
 * Generate Delivery Out Report - Excel
 */
router.post('/deliveries-out/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, clientId, clientName } = req.body;

        // Build query for DeliveryOut
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

        // Filter by client
        if (clientId) {
            query.clientId = clientId;
        } else if (clientName) {
            query.clientName = clientName;
        }

        // Fetch DeliveryOut data
        const deliveries = await DeliveryOut.find(query)
            .sort({ deliveryDate: -1 })
            .lean();

        // Transform data for report
        const deliveryData = deliveries.map(delivery => {
            const itemsText = delivery.items && delivery.items.length > 0
                ? delivery.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                deliveryDate: delivery.deliveryDate,
                deliveryNumber: delivery.deliveryNumber || 'N/A',
                clientName: delivery.clientName || 'N/A',
                staffName: delivery.staffName || 'N/A',
                items: itemsText,
                totalAmount: delivery.totalAmount || 0
            };
        });

        // Generate Excel (reuse sales Excel generator)
        const excelBuffer = await generateSalesReportExcel(deliveryData, req.user.companyId, {
            startDate,
            endDate,
            reportTitle: 'Delivery Out Report'
        });

        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `delivery_out_report_${dateStr}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate delivery out Excel error:', error);
        res.status(500).json({ message: 'Error generating delivery out report', error: error.message });
    }
});

/**
 * Generate Delivery In Report - PDF
 */
router.post('/deliveries-in/pdf', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId, supplierName } = req.body;

        // Build query for DeliveryIn
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

        // Filter by supplier
        if (supplierId) {
            query.supplierId = supplierId;
        } else if (supplierName) {
            query.supplierName = supplierName;
        }

        // Fetch DeliveryIn data
        const deliveries = await DeliveryIn.find(query)
            .sort({ receiptDate: -1 })
            .lean();

        // Transform data for report
        const deliveryData = deliveries.map(delivery => {
            const itemsText = delivery.items && delivery.items.length > 0
                ? delivery.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                purchaseDate: delivery.receiptDate,
                grnNumber: delivery.grnNumber || 'N/A',
                supplierName: delivery.supplierName || 'N/A',
                staffName: delivery.staffName || 'N/A',
                items: itemsText,
                totalAmount: delivery.totalAmount || 0
            };
        });

        // Generate PDF (reuse purchase PDF generator)
        const pdfBuffer = await generatePurchasePDF(deliveryData, req.user.companyId, {
            startDate,
            endDate,
            reportTitle: 'Delivery In Report'
        });

        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `delivery_in_report_${dateStr}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate delivery in PDF error:', error);
        res.status(500).json({ message: 'Error generating delivery in report', error: error.message });
    }
});

/**
 * Generate Delivery In Report - Excel
 */
router.post('/deliveries-in/excel', authenticate, requirePermission('canViewReports'), checkReportsAccess, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { startDate, endDate, supplierId, supplierName } = req.body;

        // Build query for DeliveryIn
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

        // Filter by supplier
        if (supplierId) {
            query.supplierId = supplierId;
        } else if (supplierName) {
            query.supplierName = supplierName;
        }

        // Fetch DeliveryIn data
        const deliveries = await DeliveryIn.find(query)
            .sort({ receiptDate: -1 })
            .lean();

        // Transform data for report
        const deliveryData = deliveries.map(delivery => {
            const itemsText = delivery.items && delivery.items.length > 0
                ? delivery.items.map(item =>
                    `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                ).join(', ')
                : 'N/A';

            return {
                purchaseDate: delivery.receiptDate,
                grnNumber: delivery.grnNumber || 'N/A',
                supplierName: delivery.supplierName || 'N/A',
                staffName: delivery.staffName || 'N/A',
                items: itemsText,
                totalAmount: delivery.totalAmount || 0
            };
        });

        // Generate Excel (reuse purchase Excel generator)
        const excelBuffer = await generatePurchaseReportExcel(deliveryData, req.user.companyId, {
            startDate,
            endDate,
            reportTitle: 'Delivery In Report'
        });

        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `delivery_in_report_${dateStr}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Generate delivery in Excel error:', error);
        res.status(500).json({ message: 'Error generating delivery in report', error: error.message });
    }
});

// ========================================
// WEEKLY REPORT ENDPOINTS
// ========================================

/**
 * Preview current week's report
 * POST /api/reports/weekly/preview
 */
router.post('/weekly/preview', authenticate, async (req, res) => {
    try {
        const { generateWeeklyReport } = await import('../services/weeklyReportService.js');
        const companyId = req.user.companyId._id;

        const reportData = await generateWeeklyReport(companyId);

        if (!reportData) {
            return res.status(404).json({ message: 'No activity this week' });
        }

        res.json({
            success: true,
            report: {
                company: reportData.company.name,
                weekRange: {
                    start: reportData.weekStart,
                    end: reportData.weekEnd
                },
                metrics: reportData.metrics,
                insights: reportData.insights,
                deliveryMode: reportData.deliveryMode
            }
        });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ message: 'Failed to generate preview', error: error.message });
    }
});

/**
 * Download current week's report as PDF (Paid users only)
 * GET /api/reports/weekly/pdf
 */
router.get('/weekly/pdf', authenticate, async (req, res) => {
    try {
        const { getUserPlanFeatures } = await import('../utils/subscriptionHelpers.js');
        const { generateWeeklyReport } = await import('../services/weeklyReportService.js');
        const { generateDirectModeCharts, generateOrderModeCharts } = await import('../services/chartService.js');
        const { generateWeeklyReportPDF } = await import('../services/pdfService.js');
        const { formatDateForFilename } = await import('../utils/dateHelpers.js');

        const companyId = req.user.companyId._id;
        const userId = req.user._id;

        // Check if user is on Paid plan
        const planFeatures = await getUserPlanFeatures(userId);
        if (!planFeatures.backupAccess) {
            return res.status(403).json({
                message: 'PDF reports are only available for Paid users. Upgrade your plan to access this feature.',
                upgradeRequired: true
            });
        }

        // Generate report
        const reportData = await generateWeeklyReport(companyId);

        if (!reportData) {
            return res.status(404).json({ message: 'No activity this week' });
        }

        // Generate charts
        let charts;
        if (reportData.deliveryMode === 'direct') {
            charts = await generateDirectModeCharts(reportData.dailyData1, reportData.dailyData2);
        } else {
            charts = await generateOrderModeCharts(reportData.dailyData1, reportData.dailyData2);
        }

        // Generate PDF
        const pdfBuffer = await generateWeeklyReportPDF({
            ...reportData,
            charts,
            companyName: reportData.company.name
        });

        // Set response headers
        const dateRange = `${formatDateForFilename(reportData.weekStart)}_${formatDateForFilename(reportData.weekEnd)}`;
        const filename = `Stockwise_Weekly_Report_${reportData.company.name.replace(/\s+/g, '_')}_${dateRange}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
    }
});

/**
 * Get weekly report history
 * GET /api/reports/weekly/history
 */
router.get('/weekly/history', authenticate, async (req, res) => {
    try {
        const WeeklyReportLog = (await import('../models/WeeklyReportLog.js')).default;
        const companyId = req.user.companyId._id;
        const { limit = 10 } = req.query;

        const reports = await WeeklyReportLog.find({ companyId })
            .sort({ weekStartDate: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            reports: reports.map(r => ({
                weekRange: {
                    start: r.weekStartDate,
                    end: r.weekEndDate
                },
                sentAt: r.sentAt,
                recipientCount: r.recipients.length,
                metrics: r.metrics,
                deliveryMode: r.deliveryMode,
                status: r.status,
                pdfGenerated: r.pdfGenerated
            }))
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ message: 'Failed to get report history', error: error.message });
    }
});

/**
 * Manual trigger for weekly reports (Admin/Testing only)
 * POST /api/reports/weekly/trigger
 */
router.post('/weekly/trigger', authenticate, async (req, res) => {
    try {
        // Only allow super admin or owner
        if (req.user.role !== 'owner' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { triggerWeeklyReportsManually } = await import('../jobs/weeklyReportJob.js');
        const results = await triggerWeeklyReportsManually();

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ message: 'Failed to trigger reports', error: error.message });
    }
});

