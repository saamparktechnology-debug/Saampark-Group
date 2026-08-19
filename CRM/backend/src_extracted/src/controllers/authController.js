const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  verifyOTP,
} = require('../utils/emailService');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone, role_id } = req.body;

    if (!full_name || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required.');
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id, is_verified FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUsers.length > 0) {
      if (!existingUsers[0].is_verified) {
        // Resend verification OTP
        await sendEmailVerificationOTP(email, full_name);
        return successResponse(res, 200, 'Account already exists but not verified. A new OTP has been sent to your email.', { requiresVerification: true, email });
      }
      return errorResponse(res, 400, 'An account with this email already exists.');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user (unverified initially)
    const [result] = await pool.execute(
      'INSERT INTO users (role_id, full_name, email, password_hash, phone, is_verified, status) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [role_id || 3, full_name, email.toLowerCase(), hashedPassword, phone || null, 'active']
    );

    const userId = result.insertId;

    // Send verification email
    try {
      await sendEmailVerificationOTP(email, full_name);
    } catch (emailErr) {
      console.warn('Email send warning (account still created):', emailErr.message);
    }

    return successResponse(res, 201, 'Account created! Please check your email for a 6-digit OTP to verify your account.', {
      requiresVerification: true,
      email: email.toLowerCase(),
      userId,
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, 'Email and OTP are required.');

    const result = verifyOTP(email.toLowerCase(), otp, 'verify');
    if (!result.valid) return errorResponse(res, 400, result.error);

    // Mark user as verified
    await pool.execute('UPDATE users SET is_verified = 1 WHERE email = ?', [email.toLowerCase()]);

    // Fetch user details for welcome email
    const [users] = await pool.execute(
      'SELECT u.full_name, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email.toLowerCase()]
    );

    if (users.length > 0) {
      try {
        await sendWelcomeEmail(email, users[0].full_name, users[0].role_name);
      } catch (emailErr) {
        console.warn('Welcome email warning:', emailErr.message);
      }
    }

    return successResponse(res, 200, 'Email verified successfully! You can now log in.');
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required.');
    }

    const [users] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return errorResponse(res, 401, 'Account does not exist. Please contact your System Administrator.');
    }

    const user = users[0];

    // Check email verification
    if (user.is_verified === 0) {
      // Resend OTP
      try { await sendEmailVerificationOTP(email, user.full_name); } catch (e) {}
      return errorResponse(res, 403, 'Email not verified. A new OTP has been sent to your email.');
    }

    if (user.status !== 'active') {
      return errorResponse(res, 403, 'Your account is deactivated. Please contact your administrator.');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid password. Please try again.');
    }

    const token = generateToken({ id: user.id, email: user.email, role_id: user.role_id });

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    delete user.password_hash;

    return successResponse(res, 200, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

// ─── SEND FORGOT PASSWORD OTP ─────────────────────────────────────────────────
const sendForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, 'Email address is required.');

    const [users] = await pool.execute('SELECT full_name FROM users WHERE email = ?', [email.toLowerCase()]);

    // Always respond with success to prevent email enumeration
    if (users.length === 0) {
      return successResponse(res, 200, 'If an account with that email exists, an OTP has been sent.');
    }

    const user = users[0];
    try {
      await sendPasswordResetOTP(email, user.full_name);
    } catch (emailErr) {
      console.error('OTP email error:', emailErr.message);
      return errorResponse(res, 500, 'Failed to send OTP email. Please try again later.');
    }

    return successResponse(res, 200, 'OTP sent to your email address. Valid for 10 minutes.');
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY RESET OTP ─────────────────────────────────────────────────────────
const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, 'Email and OTP are required.');

    const result = verifyOTP(email.toLowerCase(), otp, 'reset');
    if (!result.valid) return errorResponse(res, 400, result.error);

    // Issue a short-lived reset token
    const resetToken = generateToken({ email: email.toLowerCase(), purpose: 'password_reset' }, '15m');

    return successResponse(res, 200, 'OTP verified successfully.', { resetToken });
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, resetToken } = req.body;
    if (!email || !newPassword || !resetToken) {
      return errorResponse(res, 400, 'Email, new password and reset token are required.');
    }

    // Verify the reset token
    const { verifyToken } = require('../utils/generateToken');
    let decoded;
    try {
      decoded = verifyToken(resetToken);
    } catch {
      return errorResponse(res, 401, 'Invalid or expired reset token. Please start over.');
    }

    if (decoded.purpose !== 'password_reset' || decoded.email !== email.toLowerCase()) {
      return errorResponse(res, 401, 'Invalid reset token.');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters.');
    }

    const hashedPassword = await hashPassword(newPassword);
    await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);

    return successResponse(res, 200, 'Password reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT u.id, u.full_name, u.email, u.phone, u.status, u.permissions, u.last_login, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 404, 'User profile not found.');
    }

    return successResponse(res, 200, 'User profile retrieved', users[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, verifyEmail, login, sendForgotPasswordOTP, verifyResetOTP, resetPassword, getProfile };