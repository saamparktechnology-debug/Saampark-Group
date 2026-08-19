const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  verifyEmail,
  login,
  sendForgotPasswordOTP,
  verifyResetOTP,
  resetPassword,
  getProfile,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { status: 'error', message: 'Too many OTP requests. Please wait 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', otpLimiter, sendForgotPasswordOTP);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, getProfile);

module.exports = router;