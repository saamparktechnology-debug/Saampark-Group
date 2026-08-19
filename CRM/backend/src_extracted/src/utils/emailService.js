const nodemailer = require('nodemailer');

// ─── SMTP Transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'supriyogod@gmail.com',
    pass: 'vctonocakbbgbvib', // Gmail App Password
  },
});

// ─── OTP In-Memory Store ──────────────────────────────────────────────────────
// { email: { otp: '123456', expiresAt: Date, type: 'verify'|'reset', attempts: 0 } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store an OTP for an email
 */
function storeOTP(email, otp, type = 'reset') {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    type,
    attempts: 0,
  });
}

/**
 * Verify OTP for an email. Returns { valid, error }
 */
function verifyOTP(email, inputOtp, type = 'reset') {
  const record = otpStore.get(email.toLowerCase());
  if (!record) return { valid: false, error: 'OTP not found. Please request a new one.' };
  if (record.type !== type) return { valid: false, error: 'Invalid OTP type.' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }
  if (record.otp !== inputOtp) {
    record.attempts += 1;
    return { valid: false, error: `Invalid OTP. ${MAX_OTP_ATTEMPTS - record.attempts} attempts remaining.` };
  }
  // Success — remove from store
  otpStore.delete(email.toLowerCase());
  return { valid: true };
}

/**
 * Send OTP email for password reset
 */
async function sendPasswordResetOTP(email, name = 'User') {
  const otp = generateOTP();
  storeOTP(email, otp, 'reset');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SAAMPARK CRM</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Password Reset Request</p>
      </div>
      <div style="padding: 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 8px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
          We received a request to reset your SAAMPARK CRM password. Use the OTP below to proceed:
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Your OTP Code</p>
          <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6366f1; font-family: monospace;">${otp}</div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">⏱ Valid for <strong style="color: #f59e0b;">10 minutes</strong></p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
          If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK CRM" <supriyogod@gmail.com>',
    to: email,
    subject: '🔐 Your SAAMPARK CRM Password Reset OTP',
    html,
  });

  return otp;
}

/**
 * Send OTP email for email verification after registration
 */
async function sendEmailVerificationOTP(email, name = 'User') {
  const otp = generateOTP();
  storeOTP(email, otp, 'verify');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SAAMPARK CRM</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Email Verification</p>
      </div>
      <div style="padding: 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 8px;">Welcome, <strong>${name}</strong>! 🎉</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
          Your SAAMPARK CRM account has been created. Please verify your email address using the OTP below:
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Verification Code</p>
          <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #10b981; font-family: monospace;">${otp}</div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">⏱ Valid for <strong style="color: #f59e0b;">10 minutes</strong></p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
          Once verified, you can log in to your account using your registered credentials.
        </p>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK CRM" <supriyogod@gmail.com>',
    to: email,
    subject: '✅ Verify Your SAAMPARK CRM Email',
    html,
  });

  return otp;
}

/**
 * Send welcome email after successful verification
 */
async function sendWelcomeEmail(email, name = 'User', role = 'Team Member') {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">SAAMPARK CRM</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Welcome Aboard 🚀</p>
      </div>
      <div style="padding: 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Your email has been verified and your <strong style="color: #6366f1;">${role}</strong> account is now active on SAAMPARK CRM.
        </p>
        <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #e2e8f0; font-size: 13px; margin: 0;"><strong>Email:</strong> <span style="color: #6366f1;">${email}</span></p>
          <p style="color: #e2e8f0; font-size: 13px; margin: 8px 0 0;"><strong>Role:</strong> <span style="color: #10b981;">${role}</span></p>
        </div>
        <a href="http://localhost:3000/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Login to Your Account →
        </a>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK CRM" <supriyogod@gmail.com>',
    to: email,
    subject: '🎉 Welcome to SAAMPARK CRM — Account Activated!',
    html,
  });
}

module.exports = {
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  verifyOTP,
  generateOTP,
  storeOTP,
};
