import express from 'express';
import StockItem from '../models/StockItem.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
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
      revenueData,
      lowStockCount,
      totalReceivables,
      totalPayables
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

      // Revenue statistics from sales orders
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

      // Total receivables - sum of amountDue from unpaid/partial sales orders
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

      // Total payables - sum of amountDue from unpaid/partial purchase orders
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
      ])
    ]);

    const stockValue = totalStockValue[0] || { totalValue: 0, totalQuantity: 0 };
    const revenue = revenueData[0] || { totalRevenue: 0, totalSales: 0 };
    const lowStock = lowStockCount[0]?.lowStockCount || 0;

    // Better fallback for receivables and payables
    const receivables = (totalReceivables && totalReceivables[0])
      ? (totalReceivables[0].totalReceivables || 0)
      : 0;
    const payables = (totalPayables && totalPayables[0])
      ? (totalPayables[0].totalPayables || 0)
      : 0;

    res.json({
      stats: {
        totalItems,
        totalStockValue: stockValue.totalValue,
        totalQuantity: stockValue.totalQuantity,
        warehouseCount,
        totalRevenue: revenue.totalRevenue,
        totalSales: revenue.totalSales,
        lowStockCount: lowStock,
        totalReceivables: receivables,
        totalPayables: payables
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
