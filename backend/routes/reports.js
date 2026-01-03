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

        const { startDate, endDate } = req.body;
        const SalesOrder = (await import('../models/SalesOrder.js')).default;

        // Build query for date filtering
        const query = { companyId };
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.orderDate.$lte = end;
            }
        }

        // Aggregate client financial data from sales orders
        const clientData = await SalesOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$clientId',
                    clientName: { $first: '$clientName' },
                    totalBills: { $sum: 1 },
                    paidBills: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    unpaidBills: {
                        $sum: {
                            $cond: [{ $ne: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    totalReceivable: { $sum: '$amountDue' },
                    totalReceived: { $sum: '$amountPaid' }
                }
            },
            { $sort: { totalReceivable: -1 } }
        ]);

        // Generate PDF
        const pdfBuffer = await generateClientReportPDF(clientData, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `client_report_${dateStr}_${Date.now()}.pdf`;

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

        const { startDate, endDate } = req.body;
        const SalesOrder = (await import('../models/SalesOrder.js')).default;

        // Build query for date filtering
        const query = { companyId };
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.orderDate.$lte = end;
            }
        }

        // Aggregate client financial data from sales orders
        const clientData = await SalesOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$clientId',
                    clientName: { $first: '$clientName' },
                    totalBills: { $sum: 1 },
                    paidBills: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    unpaidBills: {
                        $sum: {
                            $cond: [{ $ne: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    totalReceivable: { $sum: '$amountDue' },
                    totalReceived: { $sum: '$amountPaid' }
                }
            },
            { $sort: { totalReceivable: -1 } }
        ]);

        // Generate Excel
        const excelBuffer = await generateClientReportExcel(clientData, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `client_report_${dateStr}_${Date.now()}.xlsx`;

        // Send Excel
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

        const { startDate, endDate } = req.body;
        const PurchaseOrder = (await import('../models/PurchaseOrder.js')).default;

        // Build query for date filtering
        const query = { companyId };
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.orderDate.$lte = end;
            }
        }

        // Aggregate supplier financial data from purchase orders
        const supplierData = await PurchaseOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$supplierId',
                    supplierName: { $first: '$supplierName' },
                    totalBills: { $sum: 1 },
                    paidBills: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    unpaidBills: {
                        $sum: {
                            $cond: [{ $ne: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    totalPayable: { $sum: '$amountDue' },
                    totalPaid: { $sum: '$amountPaid' }
                }
            },
            { $sort: { totalPayable: -1 } }
        ]);

        // Generate PDF
        const pdfBuffer = await generateSupplierReportPDF(supplierData, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `supplier_report_${dateStr}_${Date.now()}.pdf`;

        // Send PDF
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

        const { startDate, endDate } = req.body;
        const PurchaseOrder = (await import('../models/PurchaseOrder.js')).default;

        // Build query for date filtering
        const query = { companyId };
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.orderDate.$lte = end;
            }
        }

        // Aggregate supplier financial data from purchase orders
        const supplierData = await PurchaseOrder.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$supplierId',
                    supplierName: { $first: '$supplierName' },
                    totalBills: { $sum: 1 },
                    paidBills: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    unpaidBills: {
                        $sum: {
                            $cond: [{ $ne: ['$paymentStatus', 'paid'] }, 1, 0]
                        }
                    },
                    totalPayable: { $sum: '$amountDue' },
                    totalPaid: { $sum: '$amountPaid' }
                }
            },
            { $sort: { totalPayable: -1 } }
        ]);

        // Generate Excel
        const excelBuffer = await generateSupplierReportExcel(supplierData, req.user.companyId, { startDate, endDate });

        // Generate filename
        const dateStr = startDate && endDate
            ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
            : 'all_time';
        const filename = `supplier_report_${dateStr}_${Date.now()}.xlsx`;

        // Send Excel
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
