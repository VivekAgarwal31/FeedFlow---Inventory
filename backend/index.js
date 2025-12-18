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
import clientRoutes from './routes/clients.js';
import stockRoutes from './routes/stock.js';
import { startHttpPing } from './utils/keepAlive.js';
import { startDbPing } from './utils/dbPing.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock-transactions', stockTransactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stock', stockRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ping endpoint for keep-alive
app.get('/api/ping', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // Start HTTP ping to keep Render service alive
  startHttpPing();
});
