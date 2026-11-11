import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './db.js';
import {
  getProducts,
  chatWithSalesAI,
  getQuoteById,
  getAllQuotes,
  approveQuote
} from './controllers/quoteController.js';
import {
  createCheckoutSession,
  capturePayment,
  handlePayPalWebhook,
  getPaymentHistory
} from './controllers/paymentController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & seed demo catalogue
initializeDatabase();

app.use(cors());
app.use(express.json());

// System & Health Status
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DealFlow AI API',
    version: '1.0.0',
    paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_ID.includes('your_')),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_'))
  });
});

// Products & Catalogue
app.get('/api/products', getProducts);

// AI Sales Dialogue & Quotes
app.post('/api/ai/chat', chatWithSalesAI);
app.get('/api/quotes', getAllQuotes);
app.get('/api/quotes/:id', getQuoteById);
app.post('/api/quotes/:id/approve', approveQuote);

// PayPal Checkout & Payments
app.post('/api/checkout/create-order', createCheckoutSession);
app.post('/api/checkout/capture-order', capturePayment);
app.post('/api/webhooks/paypal', handlePayPalWebhook);
app.get('/api/payments/history', getPaymentHistory);

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` DealFlow AI Backend running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` SQLite Database initialized successfully.`);
  console.log(`===============================================`);
});

export default app;
