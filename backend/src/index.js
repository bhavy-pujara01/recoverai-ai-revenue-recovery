require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const customerRoutes = require('./routes/customerRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// RecoverAI Production Server Configuration

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root Landing Status Route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>RecoverAI API Server</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; line-height: 1.6; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; }
        h1 { color: #10b981; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 8px; }
        .badge { background: #064e3b; color: #6ee7b7; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
        .btn { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; padding: 10px 18px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .btn:hover { background: #34d399; }
        ul { padding-left: 20px; font-size: 14px; color: #94a3b8; }
        li { margin-bottom: 6px; }
        a.link { color: #38bdf8; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>⚡ RecoverAI Backend API Server <span class="badge">Running</span></h1>
        <p>The RecoverAI backend REST API & Deterministic Intelligence Engine is active on <strong>port 5000</strong>.</p>
        
        <p><strong>Quick Links:</strong></p>
        <ul>
          <li>🖥️ <strong>Web Application UI:</strong> <a class="link" href="http://localhost:5173" target="_blank">http://localhost:5173</a></li>
          <li>🩺 <strong>API Health Status:</strong> <a class="link" href="/api/health">/api/health</a></li>
          <li>📊 <strong>API Documentation:</strong> See README.md in workspace</li>
        </ul>

        <a class="btn" href="http://localhost:5173" target="_blank">Open RecoverAI Web App (Port 5173) →</a>
      </div>
    </body>
    </html>
  `);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'RecoverAI Intelligent Payment Revenue Recovery Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized Error Handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[RecoverAI Backend] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
