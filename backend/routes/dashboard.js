import express from 'express';
import StockItem from '../models/StockItem.js';
import Sale from '../models/Sale.js';
import Warehouse from '../models/Warehouse.js';
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
      lowStockCount
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

      // Revenue statistics
      Sale.aggregate([
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
      ])
    ]);

    const stockValue = totalStockValue[0] || { totalValue: 0, totalQuantity: 0 };
    const revenue = revenueData[0] || { totalRevenue: 0, totalSales: 0 };
    const lowStock = lowStockCount[0]?.lowStockCount || 0;

    res.json({
      stats: {
        totalItems,
        totalStockValue: stockValue.totalValue,
        totalQuantity: stockValue.totalQuantity,
        warehouseCount,
        totalRevenue: revenue.totalRevenue,
        totalSales: revenue.totalSales,
        lowStockCount: lowStock
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
