import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticate } from '../middleware/auth.js';
import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';

const router = express.Router();

// Initialize Razorpay instance lazily
let razorpayInstance = null;
const getRazorpay = () => {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpayInstance;
};

// Create Razorpay order
router.post('/create-order', authenticate, async (req, res) => {
    try {
        const { planType } = req.body;

        // Validate plan type
        if (planType !== 'paid') {
            return res.status(400).json({ message: 'Invalid plan type' });
        }

        // Check if user already has paid plan
        const currentSubscription = await UserSubscription.findOne({ userId: req.user._id })
            .populate('planId');

        if (currentSubscription && currentSubscription.planId.type === 'paid') {
            return res.status(400).json({ message: 'You already have a paid plan' });
        }

        // Get paid plan
        const paidPlan = await Plan.findOne({ type: 'paid', isActive: true });
        if (!paidPlan) {
            return res.status(404).json({ message: 'Paid plan not found' });
        }

        // Calculate amount (in paise for Razorpay)
        const amount = paidPlan.price * 100; // Convert to paise

        // Get Razorpay instance
        const razorpay = getRazorpay();

        // Create Razorpay order (receipt must be <= 40 chars)
        const receiptId = `rcpt_${Date.now()}_${req.user._id.toString().slice(-8)}`;
        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: req.user._id.toString(),
                planId: paidPlan._id.toString(),
                planType: 'paid'
            }
        });

        // Store order in database
        const payment = new SubscriptionPayment({
            userId: req.user._id,
            orderId: razorpayOrder.id,
            amount: paidPlan.price,
            currency: 'INR',
            planId: paidPlan._id,
            status: 'pending',
            metadata: {
                currentPlan: currentSubscription?.planId?.type || 'none',
                isTrial: currentSubscription?.trial?.isTrial || false
            }
        });

        await payment.save();

        res.json({
            orderId: razorpayOrder.id,
            amount: paidPlan.price,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

// Verify payment and update subscription
router.post('/verify', authenticate, async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // SECURITY HARDENING: Verify signature using timing-safe comparison
        // This prevents timing attacks on signature validation
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        // Use timingSafeEqual to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(generatedSignature, 'utf8'),
            Buffer.from(signature, 'utf8')
        );

        if (!isValid) {
            // SECURITY: Log failed verification attempts for audit
            console.warn('⚠️  SECURITY: Razorpay signature verification failed', {
                orderId,
                timestamp: new Date().toISOString(),
                userId: req.user._id
            });

            // Update payment status to failed
            await SubscriptionPayment.findOneAndUpdate(
                { orderId },
                { status: 'failed' }
            );
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Find payment record
        const payment = await SubscriptionPayment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // AUDIT FIX - TASK 7: Idempotency check
        // Prevent duplicate payment verification and subscription updates
        if (payment.status === 'success') {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                subscription: await UserSubscription.findOne({ userId: req.user._id }).populate('planId')
            });
        }

        // Update payment record
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'success';
        await payment.save();

        // Get paid plan
        const paidPlan = await Plan.findById(payment.planId);
        if (!paidPlan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Update user subscription
        const subscription = await UserSubscription.findOne({ userId: req.user._id });

        if (subscription) {
            // Update existing subscription
            subscription.planId = paidPlan._id;
            subscription.status = 'active';
            subscription.trial.isTrial = false;
            subscription.trial.endsAt = null;
            subscription.expiresAt = null; // Paid plan is permanent
            subscription.updatedByAdmin = false;
            await subscription.save();
        } else {
            // Create new subscription (edge case)
            await UserSubscription.create({
                userId: req.user._id,
                planId: paidPlan._id,
                status: 'active',
                trial: {
                    isTrial: false,
                    endsAt: null
                },
                expiresAt: null,
                updatedByAdmin: false
            });
        }

        // Fetch updated subscription
        const updatedSubscription = await UserSubscription.findOne({ userId: req.user._id })
            .populate('planId');

        res.json({
            success: true,
            message: 'Payment verified and plan upgraded successfully',
            subscription: updatedSubscription
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
});

export default router;
