const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const companyScopeMiddleware = require('./middlewares/companyScopeMiddleware');

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

// Security headers with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.ibb.co", "https://ibb.co"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Allow CORS from known production domains and localhost for development
const ALLOWED_ORIGINS = [
  'https://crm.saampark.com',
  'https://saampark.com',
  'https://www.saampark.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiter for auth routes — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'development', // skip in dev
});

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
// 3. API ROUTES (Single mount under /api/v1)
// ==========================================
app.use('/api/v1/auth', authLimiter); // Apply rate limit only to auth routes
app.use('/api/v1', apiRoutes);
// Legacy /api alias (redirect to v1)
app.use('/api', (req, res, next) => {
  // Forward legacy /api/* calls to /api/v1/* handlers
  req.url = req.url; // keep path same
  apiRoutes(req, res, next);
});

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