import express from 'express';
import { body, validationResult } from 'express-validator';
import Warehouse from '../models/Warehouse.js';
import StockItem from '../models/StockItem.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all warehouses for the company
router.get('/', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const warehouses = await Warehouse.find({ companyId })
            .sort({ name: 1 })
            .lean();

        res.json({ warehouses });
    } catch (error) {
        console.error('Get warehouses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single warehouse
router.get('/:id', authenticate, async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;
        const warehouse = await Warehouse.findOne({
            _id: req.params.id,
            companyId
        }).lean();

        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        res.json({ warehouse });
    } catch (error) {
        console.error('Get warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create warehouse
router.post('/', authenticate, requirePermission('canManageInventory'), [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('location').optional().trim(),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user' });
        }

        const { name, location, capacity, description } = req.body;

        const warehouse = new Warehouse({
            companyId,
            name,
            location,
            capacity: capacity || 0,
            description
        });

        await warehouse.save();

        // Get all unique stock items for this company (one per item name/category/bagSize combination)
        const existingItems = await StockItem.find({ companyId }).lean();

        // Create a map to track unique items by their identifying properties
        const uniqueItemsMap = new Map();

        for (const item of existingItems) {
            const key = `${item.itemName}_${item.bagSize}_${item.category}`;
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, item);
            }
        }

        // Create stock items for this new warehouse with 0 quantity
        const stockItemsToCreate = [];
        for (const [, item] of uniqueItemsMap) {
            stockItemsToCreate.push({
                companyId,
                warehouseId: warehouse._id,
                itemName: item.itemName,
                category: item.category,
                itemCategory: item.itemCategory,
                bagSize: item.bagSize,
                quantity: 0,
                costPrice: item.costPrice || 0,
                sellingPrice: item.sellingPrice || 0,
                lowStockAlert: item.lowStockAlert || 10
            });
        }

        if (stockItemsToCreate.length > 0) {
            await StockItem.insertMany(stockItemsToCreate);
        }

        res.status(201).json({
            message: `Warehouse created successfully${stockItemsToCreate.length > 0 ? ` with ${stockItemsToCreate.length} stock item(s)` : ''}`,
            warehouse,
            stockItemsCreated: stockItemsToCreate.length
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Warehouse with this name already exists' });
        }
        console.error('Create warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update warehouse
router.put('/:id', authenticate, requirePermission('canManageInventory'), [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('location').optional().trim(),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const companyId = req.user.companyId?._id || req.user.companyId;
        const { name, location, capacity, description } = req.body;

        const warehouse = await Warehouse.findOneAndUpdate(
            { _id: req.params.id, companyId },
            { name, location, capacity, description },
            { new: true, runValidators: true }
        );

        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        res.json({
            message: 'Warehouse updated successfully',
            warehouse
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Warehouse with this name already exists' });
        }
        console.error('Update warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete warehouse
router.delete('/:id', authenticate, requirePermission('canManageInventory'), async (req, res) => {
    try {
        const companyId = req.user.companyId?._id || req.user.companyId;

        const warehouse = await Warehouse.findOneAndDelete({
            _id: req.params.id,
            companyId
        });

        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
        console.error('Delete warehouse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
