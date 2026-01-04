import express from 'express';
import StockItem from '../models/StockItem.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DirectSale from '../models/DirectSale.js';
import DirectPurchase from '../models/DirectPurchase.js';
import DeliveryOut from '../models/DeliveryOut.js';
import Warehouse from '../models/Warehouse.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId?._id || req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with user' });
    }

    // Get all stats in parallel
    const [
      totalItems,
      totalStockValue,
      warehouseCount,
      salesOrderRevenue,
      directSaleRevenue,
      lowStockCount,
      salesOrderReceivables,
      directSaleReceivables,
      purchaseOrderPayables,
      directPurchasePayables,
      clients, // Added for client opening balances
      suppliers // Added for supplier opening balances
    ] = await Promise.all([
      // Total stock items count
      StockItem.countDocuments({ companyId }),

      // Total stock value (quantity * selling price)
      StockItem.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ['$quantity', '$sellingPrice'] }
            },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),

      // Warehouse count
      Warehouse.countDocuments({ companyId }),

      // Revenue from sales orders
      SalesOrder.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Revenue from direct sales
      DirectSale.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Low stock items count
      StockItem.aggregate([
        { $match: { companyId } },
        {
          $addFields: {
            isLowStock: { $lte: ['$quantity', '$lowStockAlert'] }
          }
        },
        { $match: { isLowStock: true } },
        { $count: 'lowStockCount' }
      ]),

      // Receivables from sales orders
      SalesOrder.aggregate([
        {
          $match: {
            companyId,
            paymentStatus: { $in: ['pending', 'partial'] }
          }
        },
        {
          $group: {
            _id: null,
            totalReceivables: { $sum: '$amountDue' }
          }
        }
      ]),

      // Receivables from direct sales (only credit transactions)
      DirectSale.aggregate([
        {
          $match: {
            companyId,
            paymentType: 'credit', // Only include credit transactions
            paymentStatus: { $in: ['pending', 'partial'] }
          }
        },
        {
          $addFields: {
            amountDue: { $subtract: ['$totalAmount', { $ifNull: ['$amountPaid', 0] }] }
          }
        },
        {
          $group: {
            _id: null,
            totalReceivables: { $sum: '$amountDue' }
          }
        }
      ]),

      // Payables from purchase orders
      PurchaseOrder.aggregate([
        {
          $match: {
            companyId,
            paymentStatus: { $in: ['pending', 'partial'] }
          }
        },
        {
          $group: {
            _id: null,
            totalPayables: { $sum: '$amountDue' }
          }
        }
      ]),

      // Payables from direct purchases (only credit transactions)
      DirectPurchase.aggregate([
        {
          $match: {
            companyId,
            paymentType: 'credit', // Only include credit transactions
            paymentStatus: { $in: ['pending', 'partial'] }
          }
        },
        {
          $addFields: {
            amountDue: { $subtract: ['$totalAmount', { $ifNull: ['$amountPaid', 0] }] }
          }
        },
        {
          $group: {
            _id: null,
            totalPayables: { $sum: '$amountDue' }
          }
        }
      ]),

      // Get all clients for opening balance
      Client.find({ companyId }).select('openingBalance').lean(),

      // Get all suppliers for opening balance
      Supplier.find({ companyId }).select('openingBalance').lean()
    ]);

    const stockValue = totalStockValue[0] || { totalValue: 0, totalQuantity: 0 };
    const orderRevenue = salesOrderRevenue[0] || { totalRevenue: 0, totalSales: 0 };
    const directRevenue = directSaleRevenue[0] || { totalRevenue: 0, totalSales: 0 };
    const lowStock = lowStockCount[0]?.lowStockCount || 0;

    // Combine revenue from both sources
    const totalRevenue = orderRevenue.totalRevenue + directRevenue.totalRevenue;
    const totalSales = orderRevenue.totalSales + directRevenue.totalSales;

    // Combine receivables from both sources
    const orderReceivables = (salesOrderReceivables && salesOrderReceivables[0])
      ? (salesOrderReceivables[0].totalReceivables || 0)
      : 0;
    const directReceivables = (directSaleReceivables && directSaleReceivables[0])
      ? (directSaleReceivables[0].totalReceivables || 0)
      : 0;
    let totalReceivables = orderReceivables + directReceivables;

    // Combine payables from both sources
    const orderPayables = (purchaseOrderPayables && purchaseOrderPayables[0])
      ? (purchaseOrderPayables[0].totalPayables || 0)
      : 0;
    const directPayables = (directPurchasePayables && directPurchasePayables[0])
      ? (directPurchasePayables[0].totalPayables || 0)
      : 0;
    let totalPayables = orderPayables + directPayables;

    // Add opening balances to totals
    const clientOpeningBalance = clients.reduce((sum, client) => sum + (client.openingBalance || 0), 0);
    const supplierOpeningBalance = suppliers.reduce((sum, supplier) => sum + (supplier.openingBalance || 0), 0);

    totalReceivables += clientOpeningBalance;
    totalPayables += supplierOpeningBalance;

    res.json({
      stats: {
        totalItems,
        totalStockValue: stockValue.totalValue,
        totalQuantity: stockValue.totalQuantity,
        warehouseCount,
        totalRevenue,
        totalSales,
        lowStockCount: lowStock,
        totalReceivables,
        totalPayables
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock items
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId?._id || req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with user' });
    }

    const lowStockItems = await StockItem.aggregate([
      { $match: { companyId } },
      {
        $addFields: {
          isLowStock: { $lte: ['$quantity', '$lowStockAlert'] }
        }
      },
      { $match: { isLowStock: true } },
      { $sort: { quantity: 1 } },
      { $limit: 20 }
    ]);

    res.json({ lowStockItems });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
