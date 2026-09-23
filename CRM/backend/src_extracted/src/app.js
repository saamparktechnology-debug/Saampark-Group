const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const companyScopeMiddleware = require('./middlewares/companyScopeMiddleware');

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

// Security headers
app.use(helmet());

// Enable CORS — allow from all domains including crm.saampark.com
app.use(cors({
  origin: true,
  credentials: true,
}));


// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(companyScopeMiddleware);


// ==========================================
// 2. HEALTH CHECK ROUTE
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CRM API is up and running smoothly',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 3. API ROUTES (Mounting routes under /api/v1 and /api)
// ==========================================
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// ==========================================
// 4. UNHANDLED ROUTES HANDLER (404)
// ==========================================
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find route ${req.originalUrl} on this server`
  });
});

// ==========================================
// 5. GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use(errorHandler);

module.exports = app;