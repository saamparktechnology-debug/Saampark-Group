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
 * Send welcome email with credentials for admin-created accounts (bypasses OTP verification)
 */
async function sendAdminCreatedAccountEmail(email, name = 'Team Member', role = 'Teams', companyName = 'SAAMPARK Technology', tempPassword = '') {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SAAMPARK CRM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">Welcome to the Team! 🚀</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Congratulations! An Administrator has added you to <strong style="color: #6366f1;">${companyName}</strong> with the role of <strong style="color: #10b981;">${role}</strong>.
        </p>

        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; font-weight: 700;">Your Account Credentials</p>
          <div style="margin-bottom: 12px;">
            <span style="color: #64748b; font-size: 12px; display: block; margin-bottom: 4px;">Login Email:</span>
            <span style="color: #e2e8f0; font-size: 15px; font-weight: 600; font-family: monospace;">${email}</span>
          </div>
          <div>
            <span style="color: #64748b; font-size: 12px; display: block; margin-bottom: 4px;">Temporary Password:</span>
            <span style="color: #f59e0b; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${tempPassword}</span>
          </div>
        </div>

        <div style="background: #1e1b4b; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
          <p style="color: #c7d2fe; font-size: 13px; margin: 0; line-height: 1.5;">
            🔒 <strong>Security Instruction:</strong> Please log in to your account at <a href="https://crm.saampark.com" style="color: #818cf8; text-decoration: underline;">https://crm.saampark.com</a> and change your temporary password immediately from your <strong>Settings / Security</strong> profile.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">
            Log In to SAAMPARK CRM →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK CRM" <supriyogod@gmail.com>',
    to: email,
    subject: `🎉 Congratulations! You have been added as ${role} at ${companyName}`,
    html,
  });
}

/**
 * Send a welcome email to a newly registered user (stub — alias to sendAdminCreatedAccountEmail)
 */
async function sendWelcomeEmail(email, name = 'Team Member', role = 'Teams', companyName = 'SAAMPARK Technology') {
  try {
    await sendAdminCreatedAccountEmail(email, name, role, companyName, '');
  } catch (err) {
    console.warn('sendWelcomeEmail warning:', err.message);
  }
}

module.exports = {
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  sendAdminCreatedAccountEmail,
  verifyOTP,
  generateOTP,
  storeOTP,
};


