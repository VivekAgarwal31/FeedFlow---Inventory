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

/**
 * Test endpoint - Send weekly report to ONLY the logged-in user
 * POST /api/reports/weekly/test-send
 */
router.post('/weekly/test-send', authenticate, async (req, res) => {
    try {
        const { generateWeeklyReport } = await import('../services/weeklyReportService.js');
        const { generateDirectModeCharts, generateOrderModeCharts } = await import('../services/chartService.js');
        const { generateWeeklyReportPDF } = await import('../services/pdfService.js');
        const { getUserPlanFeatures } = await import('../utils/subscriptionHelpers.js');
        const { formatDateRange, formatDateForFilename } = await import('../utils/dateHelpers.js');
        const { Resend } = await import('resend');
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const companyId = req.user.companyId._id;
        const userEmail = req.user.email;
        const userId = req.user._id;

        console.log(`📧 Test send to: ${userEmail}`);

        // Generate report data
        const reportData = await generateWeeklyReport(companyId);
        if (!reportData) {
            return res.status(404).json({ message: 'No activity this week - cannot generate report' });
        }

        // Check if user is on Paid plan
        const planFeatures = await getUserPlanFeatures(userId);
        const isPaid = planFeatures.backupAccess === true;

        console.log(`📊 User plan: ${isPaid ? 'Paid' : 'Trial/Free'}`);

        // Generate charts (for Paid users)
        let charts = null;
        if (isPaid) {
            try {
                console.log('🎨 Generating charts...');
                if (reportData.deliveryMode === 'direct') {
                    charts = await generateDirectModeCharts(reportData.dailyData1, reportData.dailyData2);
                } else {
                    charts = await generateOrderModeCharts(reportData.dailyData1, reportData.dailyData2);
                }
                console.log('✅ Charts generated successfully');
            } catch (chartError) {
                console.error('❌ Chart generation failed:', chartError);
                // Continue without charts
            }
        } else {
            console.log('⏭️  Skipping charts (Trial/Free user)');
        }

        // Generate PDF (Paid users only)
        let pdfBuffer = null;
        if (isPaid && charts) {
            pdfBuffer = await generateWeeklyReportPDF({
                ...reportData,
                charts,
                companyName: reportData.company.name
            });
        }

        // Load email template
        const templatePath = path.join(__dirname, '../templates/emails/weeklyReport.html');
        let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        // Build Weekly Activity Section (mode-specific metrics in grid)
        let activityHtml = '';
        if (reportData.deliveryMode === 'direct') {
            activityHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Weekly Activity</h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Direct Sales</div>
                                    <div style="color:#4caf50;font-size:24px;font-weight:700;">${reportData.metrics.directSalesCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Direct Purchases</div>
                                    <div style="color:#9c27b0;font-size:24px;font-weight:700;">${reportData.metrics.directPurchasesCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Stock Movements</div>
                                    <div style="color:#2196f3;font-size:24px;font-weight:700;">${reportData.metrics.stockMovementsCount}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `;
        } else {
            activityHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Weekly Activity</h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Sales Orders</div>
                                    <div style="color:#4caf50;font-size:24px;font-weight:700;">${reportData.metrics.salesOrdersCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Purchase Orders</div>
                                    <div style="color:#9c27b0;font-size:24px;font-weight:700;">${reportData.metrics.purchaseOrdersCount}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Deliveries Out</div>
                                    <div style="color:#2196f3;font-size:24px;font-weight:700;">${reportData.metrics.deliveriesOutCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Deliveries In</div>
                                    <div style="color:#00bcd4;font-size:24px;font-weight:700;">${reportData.metrics.deliveriesInCount}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `;
        }

        // Build Quick Stats Section (enhanced with new metrics)
        let quickStatsHtml = `
            <tr>
                <td style="padding:0 20px 20px;">
                    <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Inventory Summary</h3>
                    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #eee;border-radius:4px;">
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Total Inventory:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.totalInventoryQty} units across all warehouses
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Stock Health:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.metrics.totalProducts - reportData.metrics.outOfStockItems - reportData.metrics.lowStockItems} items in good stock
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Attention Needed:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.metrics.lowStockItems + reportData.metrics.outOfStockItems} items need restocking
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;">
                                <strong style="color:#111;">Weekly Transactions:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;">
                                ${reportData.metrics.stockMovementsCount} movements this week
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;

        // Add Warehouse Breakdown if available
        if (reportData.warehouseBreakdown && reportData.warehouseBreakdown.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Warehouse Breakdown</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #eee;border-radius:4px;">
            `;

            reportData.warehouseBreakdown.forEach((wh, index) => {
                const borderStyle = index < reportData.warehouseBreakdown.length - 1 ? 'border-bottom:1px solid #eee;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#666;${borderStyle}">
                            <strong style="color:#111;">${wh.warehouseName}:</strong>
                        </td>
                        <td style="padding:10px;font-size:13px;color:#333;text-align:right;${borderStyle}">
                            ${wh.itemCount} items (${wh.totalQuantity} units)
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }

        // Add Top Selling Items
        if (reportData.topSellingItems && reportData.topSellingItems.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">🔥 Top Selling Items</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#e8f5e9;border:1px solid #4caf50;border-radius:4px;">
            `;

            reportData.topSellingItems.forEach((item, index) => {
                const borderStyle = index < reportData.topSellingItems.length - 1 ? 'border-bottom:1px solid #c8e6c9;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#2e7d32;${borderStyle}">
                            <strong>${index + 1}. ${item.name}</strong>
                        </td>
                        <td style="padding:10px;font-size:13px;color:#2e7d32;text-align:right;${borderStyle}">
                            ${item.quantity} units sold
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }

        // Add Least Selling Items (Slow Movers)
        if (reportData.leastSellingItems && reportData.leastSellingItems.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">📦 Slow Movers (No Sales This Week)</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#fff3e0;border:1px solid #ff9800;border-radius:4px;">
            `;

            reportData.leastSellingItems.forEach((item, index) => {
                const borderStyle = index < reportData.leastSellingItems.length - 1 ? 'border-bottom:1px solid #ffe0b2;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#e65100;${borderStyle}">
                            ${item.name}
                        </td>
                        <td style="padding:10px;font-size:13px;color:#e65100;text-align:right;${borderStyle}">
                            ${item.quantity} units in stock
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }


        // Build insights section
        let insightsHtml = '';
        if (reportData.insights.length > 0) {
            insightsHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 10px;font-size:15px;color:#111;">Highlights</h3>
                        <ul style="padding-left:20px;margin:0;color:#333;font-size:14px;line-height:1.8;">
            `;
            reportData.insights.forEach(insight => {
                insightsHtml += `<li style="margin:6px 0;">${insight}</li>`;
            });
            insightsHtml += `
                        </ul>
                    </td>
                </tr>
            `;
        }

        // Build upgrade section (Trial users only)
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        let upgradeHtml = '';
        if (!isPaid) {
            upgradeHtml = `
                <tr>
                    <td style="padding:20px;background:#f9fafb;border-top:1px solid #eee;">
                        <p style="margin:0 0 10px;font-size:14px;color:#333;">
                            Unlock detailed reports, backups, and advanced insights by upgrading your plan.
                        </p>
                        <a href="${FRONTEND_URL}/settings"
                           style="color:#4a7cff;font-size:14px;font-weight:bold;text-decoration:none;">
                            Upgrade Now →
                        </a>
                    </td>
                </tr>
            `;
        }

        // Replace template variables
        htmlTemplate = htmlTemplate
            .replace(/{{COMPANY_NAME}}/g, reportData.company.name)
            .replace(/{{DATE_RANGE}}/g, formatDateRange(reportData.weekStart, reportData.weekEnd))
            .replace(/{{TOTAL_PRODUCTS}}/g, reportData.metrics.totalProducts)
            .replace(/{{LOW_STOCK_ITEMS}}/g, reportData.metrics.lowStockItems)
            .replace(/{{OUT_OF_STOCK_ITEMS}}/g, reportData.metrics.outOfStockItems)
            .replace(/{{ACTIVITY_SECTION}}/g, activityHtml)
            .replace(/{{QUICK_STATS}}/g, quickStatsHtml)
            .replace(/{{INSIGHTS_SECTION}}/g, insightsHtml)
            .replace(/{{UPGRADE_SECTION}}/g, upgradeHtml)
            .replace(/{{DASHBOARD_URL}}/g, `${FRONTEND_URL}/reports`);

        // Prepare email attachments
        const attachments = [];

        // Charts are now embedded as base64 data URLs, no need for CID attachments

        // Add PDF attachment (Paid users only)
        if (pdfBuffer) {
            const dateRange = `${formatDateForFilename(reportData.weekStart)}_${formatDateForFilename(reportData.weekEnd)}`;
            attachments.push({
                filename: `Stockwise_Weekly_Report_${reportData.company.name.replace(/\s+/g, '_')}_${dateRange}.pdf`,
                content: pdfBuffer
            });
        }

        // Send email via Resend
        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await resend.emails.send({
            from: 'Stockwise Reports <reports@stock-wise.in>',
            to: userEmail,
            replyTo: 'support@stock-wise.in',
            subject: `[TEST] Weekly inventory summary – ${reportData.company.name}`,
            html: htmlTemplate,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        console.log(`✅ Test email sent to ${userEmail}`);

        res.json({
            success: true,
            message: `Test email sent to ${userEmail}`,
            emailId: result.id,
            reportSummary: {
                company: reportData.company.name,
                weekRange: formatDateRange(reportData.weekStart, reportData.weekEnd),
                metricsCount: Object.keys(reportData.metrics).length,
                insightsCount: reportData.insights.length,
                chartsIncluded: !!charts,
                pdfIncluded: !!pdfBuffer,
                isPaidUser: isPaid
            }
        });
    } catch (error) {
        console.error('Test send error:', error);
        res.status(500).json({ message: 'Failed to send test email', error: error.message });
    }
});

