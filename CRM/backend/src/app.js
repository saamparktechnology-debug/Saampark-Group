const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const companyScopeMiddleware = require('./middlewares/companyScopeMiddleware');

const app = express();
app.set('trust proxy', 1);

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
// ==========================================
// PINCODE LOOKUP PROXY ROUTE
// ==========================================
app.get(['/api/v1/pincode/:pincode', '/api/pincode/:pincode'], async (req, res) => {
  const pin = String(req.params.pincode || '').trim().replace(/\D/g, '');
  if (pin.length !== 6) {
    return res.status(400).json({ status: 'Error', message: 'Invalid 6-digit pincode' });
  }
  try {
    const fetchRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(6000) });
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
        const postOffices = data[0].PostOffice;
        const places = Array.from(new Set(postOffices.map(p => p.Name).filter(Boolean)));
        const districts = Array.from(new Set(postOffices.map(p => p.District).filter(Boolean)));
        const states = Array.from(new Set(postOffices.map(p => p.State).filter(Boolean)));
        return res.json({
          status: 'Success',
          district: districts[0] || '',
          state: states[0] || '',
          country: postOffices[0]?.Country || 'India',
          places,
          districts,
          states,
        });
      }
    }
  } catch (err) {
    console.warn('[pincode proxy] primary lookup failed, trying fallback:', err.message);
  }

  // Fallback to Zippopotam
  try {
    const zipRes = await fetch(`https://api.zippopotam.us/in/${pin}`, { signal: AbortSignal.timeout(4000) });
    if (zipRes.ok) {
      const zData = await zipRes.json();
      if (Array.isArray(zData.places) && zData.places.length > 0) {
        const places = zData.places.map(p => p['place name']);
        const state = zData.places[0].state || '';
        return res.json({
          status: 'Success',
          district: places[0] || '',
          state: state,
          country: 'India',
          places,
          districts: [places[0]],
          states: [state],
        });
      }
    }
  } catch (zErr) {
    console.warn('[pincode proxy] fallback failed:', zErr.message);
  }

  return res.status(404).json({ status: 'Error', message: 'Pincode details not found' });
});

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