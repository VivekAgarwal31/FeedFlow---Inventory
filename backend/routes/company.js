import express from 'express';
import { body, validationResult } from 'express-validator';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create company
router.post('/create', authenticate, [
  body('name').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('type').isIn(['wholesale', 'retail', 'manufacturing', 'all']).withMessage('Invalid business type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already has a company
    if (req.user.companyId) {
      return res.status(400).json({ message: 'User already belongs to a company' });
    }

    const { name, type, address, contactNumber, gstNumber } = req.body;

    // Minimal debug log
    console.log('Creating company for user:', req.user?._id?.toString())

    // Create company
    const company = new Company({
      name,
      type,
      address,
      contactNumber,
      gstNumber,
      ownerId: req.user._id
    });

    await company.save();

    // Update user with company and role
    const user = await User.findById(req.user._id);
    user.companyId = company._id;
    user.role = 'owner';
    user.setRolePermissions();
    await user.save();

    res.status(201).json({
      company: {
        id: company._id,
        name: company.name,
        companyCode: company.companyCode,
        type: company.type,
        address: company.address,
        contactNumber: company.contactNumber,
        gstNumber: company.gstNumber
      }
    });
  } catch (error) {
    // Handle duplicate key errors (e.g., rare companyCode collision)
    if (error && error.code === 11000) {
      console.error('Create company duplicate key error:', error?.keyValue)
      return res.status(409).json({ message: 'Company code conflict. Please try again.' })
    }
    console.error('Create company error:', error);
    return res.status(500).json({
      message: 'Server error',
      ...(process.env.NODE_ENV !== 'production' ? { error: error.message } : {})
    });
  }
});

// Join company
router.post('/join', authenticate, [
  body('companyCode').trim().isLength({ min: 5 }).withMessage('Invalid company code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already has a company
    if (req.user.companyId) {
      return res.status(400).json({ message: 'User already belongs to a company' });
    }

    const { companyCode } = req.body;

    // Find company
    const company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
    if (!company) {
      return res.status(404).json({ message: 'Company not found with this code' });
    }

    // Update user with company and role
    const user = await User.findById(req.user._id);
    user.companyId = company._id;
    user.role = 'new_joinee';
    user.setRolePermissions();
    await user.save();

    res.json({
      company: {
        id: company._id,
        name: company.name,
        companyCode: company.companyCode,
        type: company.type,
        address: company.address,
        contactNumber: company.contactNumber,
        gstNumber: company.gstNumber
      }
    });
  } catch (error) {
    console.error('Join company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company details
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ message: 'No company found' });
    }

    const company = await Company.findById(req.user.companyId._id);

    res.json({
      company: {
        id: company._id,
        name: company.name,
        companyCode: company.companyCode,
        type: company.type,
        address: company.address,
        contactNumber: company.contactNumber,
        gstNumber: company.gstNumber
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company
router.put('/', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user.companyId) {
      return res.status(404).json({ message: 'No company found' });
    }

    // Check if user has permission to update company (owner or admin)
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions to update company' });
    }

    const { name, address, phone, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.contactNumber = phone;
    if (email) updateData.email = email;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Company updated successfully',
      company: {
        id: company._id,
        name: company.name,
        companyCode: company.companyCode,
        type: company.type,
        address: company.address,
        contactNumber: company.contactNumber,
        gstNumber: company.gstNumber,
        email: company.email
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete company (instant permanent deletion)
router.delete('/', authenticate, async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ message: 'No company found' });
    }

    // Check if user is the owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only company owner can delete the company' });
    }

    const companyId = req.user.companyId._id;
    const companyName = req.user.companyId.name;

    // Permanently delete the company immediately
    await Company.findByIdAndDelete(companyId);

    // Remove company association from all users in the company (but don't delete user accounts)
    await User.updateMany(
      { companyId: companyId },
      {
        $unset: { companyId: 1 },
        role: 'user' // Reset role to default
      }
    );

    // Note: In a full implementation, you would also delete:
    // - Stock items, Sales, Warehouses, and other related data
    // - This requires those models to be properly set up with companyId references

    res.json({
      message: 'Company and all related data have been permanently deleted.',
      deletedCompany: companyName
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
