import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';
import { authenticate } from '../middleware/auth.js';
import { generateOTP } from '../utils/email.js';
import { sendOtpEmail } from '../emails/services/emailService.js';

const router = express.Router();

// Register
router.post('/register', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = new User({
      fullName,
      email,
      password,
      phone
    });

    // Set default permissions for new_joinee
    user.setRolePermissions();
    await user.save();

    // Create trial subscription for new user
    try {
      const trialPlan = await Plan.getByType('trial');
      if (trialPlan) {
        await UserSubscription.createTrialSubscription(user._id, trialPlan._id);
      } else {
        console.warn('Trial plan not found, user created without subscription');
      }
    } catch (subError) {
      console.error('Failed to create trial subscription:', subError);
      // Continue with registration even if subscription creation fails
    }

    // Generate OTP for email verification
    const otpCode = generateOTP();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP for verification
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email
    await sendOtpEmail(email, otpCode, req);

    res.status(201).json({
      message: 'Account created successfully! Please check your email to verify your account.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('companyId');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified (only block if explicitly false)
    // Existing users with undefined emailVerified are allowed (legacy support)
    if (user.emailVerified === false) {
      // Generate and send new OTP
      const otpCode = generateOTP();

      // Delete any existing OTPs for this email
      await OTP.deleteMany({ email: email.toLowerCase() });

      // Create new OTP for verification
      await OTP.create({
        email: email.toLowerCase(),
        otp: otpCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Send verification email
      await sendOtpEmail(email, otpCode, req);

      return res.status(403).json({
        message: 'Email not verified. A new verification code has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Ensure permissions are set (for existing users)
    if (!user.permissions || Object.keys(user.permissions).length === 0) {
      user.setRolePermissions();
      await user.save();
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyId: user.companyId,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      companyId: req.user.companyId,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// Update profile
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('currentPassword').optional().isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Update basic info
    if (name) user.fullName = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyId: user.companyId,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request OTP
router.post('/request-otp', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send email
    try {
      await sendOtpEmail(email, otpCode, req);
      res.json({ message: 'Verification code sent to your email' });
    } catch (emailError) {
      // Handle rate limit error
      if (emailError.code === 'RATE_LIMIT_EXCEEDED') {
        return res.status(429).json({
          message: `Too many requests. Please try again in ${emailError.waitMinutes} minutes.`
        });
      }
      throw emailError;
    }
  } catch (error) {
    console.error('Request OTP error:', error);

    // Check if it's a Resend restriction error
    if (error.message && error.message.includes('You can only send testing emails')) {
      return res.status(400).json({
        message: 'Email service is in testing mode. Please use vivekagrawal6336@gmail.com to login, or contact support.'
      });
    }

    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      // Increment attempts for security
      await OTP.updateOne(
        { email: email.toLowerCase(), otp },
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new code.' });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Get user
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('companyId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark email as verified
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify code. Please try again.' });
  }
});

// Google OAuth Login
router.post('/google', [
  body('token').notEmpty().withMessage('Google token is required')
], async (req, res) => {
  try {
    console.log('Google auth request received');
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Token:', req.body.token);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    // Import Google auth service
    const { verifyGoogleToken, extractUserInfo } = await import('../services/googleAuthService.js');

    // Verify Google token
    let payload;
    try {
      payload = await verifyGoogleToken(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    // Extract user info from Google payload
    const { googleId, email, fullName, profilePicture, emailVerified } = extractUserInfo(payload);

    // Check if user exists with this email
    let user = await User.findOne({ email: email.toLowerCase() }).populate('companyId');

    if (user) {
      // User exists - link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.password ? 'both' : 'google';
        user.profilePicture = profilePicture || user.profilePicture;
        user.emailVerified = true; // Google emails are verified
        await user.save();
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user with Google auth
      user = new User({
        fullName,
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        profilePicture,
        emailVerified: true,
        role: 'new_joinee'
      });

      // Set default permissions
      user.setRolePermissions();
      await user.save();

      // Create trial subscription for new user
      try {
        const trialPlan = await Plan.getByType('trial');
        if (trialPlan) {
          await UserSubscription.createTrialSubscription(user._id, trialPlan._id);
        }
      } catch (subError) {
        console.error('Failed to create trial subscription:', subError);
      }
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyId: user.companyId,
        role: user.role,
        permissions: user.permissions,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// Microsoft OAuth Login
router.post('/microsoft', [
  body('code').notEmpty().withMessage('Authorization code is required')
], async (req, res) => {
  try {
    console.log('Microsoft auth request received');
    console.log('Request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;

    // Import Microsoft auth service
    const { exchangeCodeForToken, verifyMicrosoftToken, extractUserInfo } = await import('../services/microsoftAuthService.js');

    // Exchange code for access token
    let accessToken;
    try {
      accessToken = await exchangeCodeForToken(code);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid authorization code' });
    }

    // Verify token and get user info
    let microsoftUser;
    try {
      microsoftUser = await verifyMicrosoftToken(accessToken);
    } catch (error) {
      return res.status(401).json({ message: 'Failed to verify Microsoft token' });
    }

    // Extract user info from Microsoft payload
    const { microsoftId, email, fullName, profilePicture, emailVerified } = extractUserInfo(microsoftUser);

    // Check if user exists with this email
    let user = await User.findOne({ email: email.toLowerCase() }).populate('companyId');

    if (user) {
      // User exists - link Microsoft account if not already linked
      if (!user.microsoftId) {
        user.microsoftId = microsoftId;
        user.authProvider = user.password ? 'both' : 'microsoft';
        user.profilePicture = profilePicture || user.profilePicture;
        user.emailVerified = true; // Microsoft emails are verified
        await user.save();
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user with Microsoft auth
      user = new User({
        fullName,
        email: email.toLowerCase(),
        microsoftId,
        authProvider: 'microsoft',
        profilePicture,
        emailVerified: true,
        role: 'new_joinee'
      });

      // Set default permissions
      user.setRolePermissions();
      await user.save();

      // Create trial subscription for new user
      try {
        const trialPlan = await Plan.getByType('trial');
        if (trialPlan) {
          await UserSubscription.createTrialSubscription(user._id, trialPlan._id);
        }
      } catch (subError) {
        console.error('Failed to create trial subscription:', subError);
      }
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyId: user.companyId,
        role: user.role,
        permissions: user.permissions,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error('Microsoft auth error:', error);
    res.status(500).json({ message: 'Server error during Microsoft authentication' });
  }
});

// Get system settings (public - for checking Google auth status)
router.get('/system-settings', async (req, res) => {
  try {
    const SystemSettings = (await import('../models/SystemSettings.js')).default;
    const settings = await SystemSettings.getSettings();

    // Only return public settings
    res.json({
      googleLoginEnabled: settings.googleLoginEnabled,
      googleOneTapEnabled: settings.googleOneTapEnabled,
      microsoftLoginEnabled: settings.microsoftLoginEnabled,
      microsoftOneTapEnabled: settings.microsoftOneTapEnabled
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
