import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import dashboardRoutes from './routes/dashboard.js';
import warehouseRoutes from './routes/warehouses.js';
import saleRoutes from './routes/sales.js';
import stockTransactionRoutes from './routes/stockTransactions.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseRoutes from './routes/purchases.js';
import salesOrderRoutes from './routes/salesOrders.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import deliveryRoutes from './routes/deliveries.js';
import clientRoutes from './routes/clients.js';
import stockRoutes from './routes/stock.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';
import dataManagementRoutes from './routes/dataManagement.js';
import reportRoutes from './routes/reports.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import accountsRoutes from './routes/accounts.js';
import accountingRoutes from './routes/accounting.js';
import subscriptionRoutes from './routes/subscription.js';
import adminSubscriptionRoutes from './routes/adminSubscription.js';
import subscriptionPaymentRoutes from './routes/subscriptionPayments.js';
import adminCouponRoutes from './routes/admin/coupons.js';
import directSalesRoutes from './routes/directSales.js';
import directPurchasesRoutes from './routes/directPurchases.js';
import { startHttpPing } from './utils/keepAlive.js';
import { startDbPing } from './utils/dbPing.js';
import { startTrialExpiryJob } from './jobs/trialExpiryJob.js';
import { startWeeklyReportJob } from './jobs/weeklyReportJob.js';

// Import models to register them with Mongoose
import './models/User.js';
import './models/Company.js';
import './models/Warehouse.js';
import './models/StockItem.js';
import './models/Client.js';
import './models/Supplier.js';
import './models/Sale.js';
import './models/Purchase.js';
import './models/StockTransaction.js';
import './models/SalesOrder.js';
import './models/PurchaseOrder.js';
import './models/DeliveryOut.js';
import './models/DeliveryIn.js';
import './models/BackupMetadata.js';
import './models/ArchiveMetadata.js';
import './models/CleanupLog.js';
import './models/Payment.js';
import './models/Invoice.js';
import './models/PaymentReminder.js';
import './models/LedgerAccount.js';
import './models/JournalEntry.js';
import './models/JournalLine.js';
import './models/CashbookBalance.js';
import './models/Plan.js';
import './models/UserSubscription.js';
import './models/SubscriptionPayment.js';
import './models/Coupon.js';
import './models/CouponUsage.js';
import './models/DirectSale.js';
import './models/DirectPurchase.js';

// Load environment variables (works both locally and on Render)
dotenv.config();

// AUDIT FIX - TASK 1: Environment Variable Validation
// Validate required environment variables on startup to prevent runtime failures
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:', missingVars.join(', '));
  console.error('Please ensure these variables are set in your .env file');
  process.exit(1);
}

// Warn about optional but recommended variables
const recommendedVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RESEND_API_KEY'];
const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
if (missingRecommended.length > 0) {
  console.warn('⚠️  WARNING: Missing recommended environment variables:', missingRecommended.join(', '));
  console.warn('Some features may not work correctly without these variables');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health and ping endpoints (MUST be before other routes)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/ping', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Start DB ping to keep MongoDB connection alive
    startDbPing();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Keep-alive endpoint for MongoDB
app.get('/ping-db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send('MongoDB alive ✅');
  } catch (err) {
    console.error('Ping error:', err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock-transactions', stockTransactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data-management', dataManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin/subscription', adminSubscriptionRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/subscription-payments', subscriptionPaymentRoutes);
app.use('/api/direct-sales', directSalesRoutes);
app.use('/api/direct-purchases', directPurchasesRoutes);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // Start HTTP ping to keep Render service alive
  startHttpPing();
  // Start trial expiry background job
  startTrialExpiryJob();
  // Start weekly report email job
  startWeeklyReportJob();

  // Initialize plans if they don't exist
  try {
    const Plan = (await import('./models/Plan.js')).default;
    await Plan.initializePlans();
    console.log('✅ Plans initialized');
  } catch (error) {
    console.error('❌ Failed to initialize plans:', error);
  }
});
