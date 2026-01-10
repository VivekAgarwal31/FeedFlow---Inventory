import StockItem from '../models/StockItem.js';
import DirectSale from '../models/DirectSale.js';
import DirectPurchase from '../models/DirectPurchase.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import DeliveryOut from '../models/DeliveryOut.js';
import DeliveryIn from '../models/DeliveryIn.js';
import StockTransaction from '../models/StockTransaction.js';
import { getDailyBreakdown, getDayName } from './dateHelpers.js';

/**
 * Get metrics for Direct Delivery Mode
 */
export const getDirectModeMetrics = async (companyId, startDate, endDate) => {
    const [salesCount, purchasesCount, stockMovements] = await Promise.all([
        DirectSale.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        DirectPurchase.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        StockTransaction.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate },
            type: { $in: ['move', 'adjust'] }
        })
    ]);

    return {
        directSalesCount: salesCount,
        directPurchasesCount: purchasesCount,
        stockMovementsCount: stockMovements
    };
};

/**
 * Get metrics for Order-Based Delivery Mode
 */
export const getOrderModeMetrics = async (companyId, startDate, endDate) => {
    const [salesOrdersCount, purchaseOrdersCount, deliveriesOutCount, deliveriesInCount, stockMovements] = await Promise.all([
        SalesOrder.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        PurchaseOrder.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        DeliveryOut.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        DeliveryIn.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }),
        StockTransaction.countDocuments({
            companyId,
            createdAt: { $gte: startDate, $lte: endDate },
            type: { $in: ['move', 'adjust'] }
        })
    ]);

    return {
        salesOrdersCount,
        purchaseOrdersCount,
        deliveriesOutCount,
        deliveriesInCount,
        stockMovementsCount: stockMovements
    };
};

/**
 * Get common metrics (all modes)
 */
export const getCommonMetrics = async (companyId) => {
    const [totalProducts, lowStockItems, outOfStockItems] = await Promise.all([
        StockItem.countDocuments({ companyId }),
        StockItem.countDocuments({
            companyId,
            $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
        }),
        StockItem.countDocuments({
            companyId,
            quantity: 0
        })
    ]);

    return {
        totalProducts,
        lowStockItems,
        outOfStockItems
    };
};

/**
 * Get total inventory quantity across all warehouses
 */
export const getTotalInventoryQuantity = async (companyId) => {
    const result = await StockItem.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
    ]);

    return result.length > 0 ? result[0].totalQuantity : 0;
};

/**
 * Get warehouse breakdown (items per warehouse)
 */
export const getWarehouseBreakdown = async (companyId) => {
    const Warehouse = (await import('../models/Warehouse.js')).default;

    const warehouses = await Warehouse.find({ companyId }).select('name');
    const breakdown = [];

    for (const warehouse of warehouses) {
        const result = await StockItem.aggregate([
            { $match: { companyId, warehouseId: warehouse._id } },
            {
                $group: {
                    _id: null,
                    itemCount: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);

        if (result.length > 0) {
            breakdown.push({
                warehouseName: warehouse.name,
                itemCount: result[0].itemCount,
                totalQuantity: result[0].totalQuantity
            });
        }
    }

    return breakdown;
};

/**
 * Get top selling items for the week (Direct Mode)
 */
export const getTopSellingItemsDirect = async (companyId, startDate, endDate, limit = 3) => {
    const result = await DirectSale.aggregate([
        {
            $match: {
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'stockitems',
                localField: 'items.itemId',
                foreignField: '_id',
                as: 'itemDetails'
            }
        },
        { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: '$items.itemId',
                name: { $first: '$itemDetails.itemName' },
                totalQuantity: { $sum: '$items.quantity' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit }
    ]);

    return result.map(item => ({
        name: item.name || 'Unknown Item',
        quantity: item.totalQuantity
    }));
};

/**
 * Get top selling items for the week (Order Mode)
 */
export const getTopSellingItemsOrder = async (companyId, startDate, endDate, limit = 3) => {
    const result = await DeliveryOut.aggregate([
        {
            $match: {
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'stockitems',
                localField: 'items.itemId',
                foreignField: '_id',
                as: 'itemDetails'
            }
        },
        { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: '$items.itemId',
                name: { $first: '$itemDetails.itemName' },
                totalQuantity: { $sum: '$items.quantity' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit }
    ]);

    return result.map(item => ({
        name: item.name || 'Unknown Item',
        quantity: item.totalQuantity
    }));
};

/**
 * Get least selling items (items with low movement)
 */
export const getLeastSellingItems = async (companyId, startDate, endDate, limit = 3) => {
    // Get all items with stock
    const allItems = await StockItem.find({
        companyId,
        quantity: { $gt: 0 },
        itemName: { $exists: true, $ne: null, $ne: '' }
    }).select('itemName quantity').lean();

    if (allItems.length === 0) {
        return [];
    }

    // Get items that were sold
    const soldItemIds = new Set();
    const sales = await DirectSale.find({
        companyId,
        createdAt: { $gte: startDate, $lte: endDate }
    }).select('items.itemId').lean();

    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.itemId) {
                soldItemIds.add(item.itemId.toString());
            }
        });
    });

    // Find items that weren't sold and have valid names
    const unsoldItems = allItems
        .filter(item => !soldItemIds.has(item._id.toString()) && item.itemName && item.itemName.trim() !== '')
        .slice(0, limit)
        .map(item => ({
            name: item.itemName,
            quantity: item.quantity
        }));

    return unsoldItems;
};

/**
 * Get daily sales data for Direct Mode
 */
export const getDailySalesData = async (companyId, startDate, endDate) => {
    const days = getDailyBreakdown(startDate, endDate);
    const dailyData = [];

    for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await DirectSale.countDocuments({
            companyId,
            createdAt: { $gte: dayStart, $lte: dayEnd }
        });

        dailyData.push({
            day: getDayName(day),
            count
        });
    }

    return dailyData;
};

/**
 * Get daily purchases data for Direct Mode
 */
export const getDailyPurchasesData = async (companyId, startDate, endDate) => {
    const days = getDailyBreakdown(startDate, endDate);
    const dailyData = [];

    for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await DirectPurchase.countDocuments({
            companyId,
            createdAt: { $gte: dayStart, $lte: dayEnd }
        });

        dailyData.push({
            day: getDayName(day),
            count
        });
    }

    return dailyData;
};

/**
 * Get daily deliveries out data for Order Mode
 */
export const getDailyDeliveriesOutData = async (companyId, startDate, endDate) => {
    const days = getDailyBreakdown(startDate, endDate);
    const dailyData = [];

    for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await DeliveryOut.countDocuments({
            companyId,
            createdAt: { $gte: dayStart, $lte: dayEnd }
        });

        dailyData.push({
            day: getDayName(day),
            count
        });
    }

    return dailyData;
};

/**
 * Get daily deliveries in data for Order Mode
 */
export const getDailyDeliveriesInData = async (companyId, startDate, endDate) => {
    const days = getDailyBreakdown(startDate, endDate);
    const dailyData = [];

    for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await DeliveryIn.countDocuments({
            companyId,
            createdAt: { $gte: dayStart, $lte: dayEnd }
        });

        dailyData.push({
            day: getDayName(day),
            count
        });
    }

    return dailyData;
};

/**
 * Generate insights based on metrics and mode
 */
export const generateInsights = async (companyId, metrics, mode, startDate, endDate) => {
    const insights = [];

    // Low stock warning
    if (metrics.lowStockItems > 0) {
        insights.push(`${metrics.lowStockItems} item${metrics.lowStockItems > 1 ? 's are' : ' is'} running low on stock.`);
    }

    // Out of stock warning
    if (metrics.outOfStockItems > 0) {
        insights.push(`${metrics.outOfStockItems} item${metrics.outOfStockItems > 1 ? 's are' : ' is'} out of stock.`);
    }

    // Mode-specific insights
    if (mode === 'direct') {
        // Direct mode insights
        if (metrics.directSalesCount === 0) {
            insights.push('No sales recorded this week.');
        } else if (metrics.directSalesCount > 10) {
            insights.push(`Strong sales activity with ${metrics.directSalesCount} transactions.`);
        }

        if (metrics.directPurchasesCount === 0) {
            insights.push('No purchases recorded this week.');
        }
    } else {
        // Order mode insights
        const pendingSalesOrders = await SalesOrder.countDocuments({
            companyId,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (pendingSalesOrders > 0) {
            insights.push(`${pendingSalesOrders} sales order${pendingSalesOrders > 1 ? 's are' : ' is'} pending delivery.`);
        }

        if (metrics.deliveriesOutCount === 0) {
            insights.push('No outbound deliveries this week.');
        }

        if (metrics.deliveriesInCount === 0) {
            insights.push('No inbound deliveries this week.');
        }
    }

    // Return max 3 insights
    return insights.slice(0, 3);
};

/**
 * Check if company has activity (to avoid sending empty reports)
 */
export const hasWeeklyActivity = async (companyId, mode, startDate, endDate) => {
    if (mode === 'direct') {
        const [sales, purchases] = await Promise.all([
            DirectSale.countDocuments({
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            DirectPurchase.countDocuments({
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            })
        ]);
        return sales > 0 || purchases > 0;
    } else {
        const [deliveriesOut, deliveriesIn] = await Promise.all([
            DeliveryOut.countDocuments({
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            DeliveryIn.countDocuments({
                companyId,
                createdAt: { $gte: startDate, $lte: endDate }
            })
        ]);
        return deliveriesOut > 0 || deliveriesIn > 0;
    }
};
