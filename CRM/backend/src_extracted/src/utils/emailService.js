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

/**
 * Send full invoice details email to client
 */
async function sendInvoiceDetailsEmail({
  to,
  clientName = 'Valued Client',
  invoiceId,
  project = 'Service',
  billDate,
  dueDate,
  totalAmount,
  receivedAmount = '₹0',
  dueAmount = '₹0',
  items = [],
  viewUrl = `https://crm.saampark.com/sales/invoices?view=${invoiceId}`
}) {
  const itemsHtml = (items && items.length > 0)
    ? items.map(it => `
        <tr style="border-bottom: 1px solid #2d2d3d;">
          <td style="padding: 10px 12px; color: #e2e8f0; font-size: 13px;">${it.serviceName || project}</td>
          <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px; text-align: center;">${it.qty || 1}</td>
          <td style="padding: 10px 12px; color: #e2e8f0; font-size: 13px; text-align: right;">₹${(it.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; color: #10b981; font-weight: 700; font-size: 13px; text-align: right;">₹${(it.totalAmount || (it.rate || 0) * (it.qty || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px solid #2d2d3d;">
          <td style="padding: 10px 12px; color: #e2e8f0; font-size: 13px;">${project}</td>
          <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px; text-align: center;">1</td>
          <td style="padding: 10px 12px; color: #e2e8f0; font-size: 13px; text-align: right;">${totalAmount}</td>
          <td style="padding: 10px 12px; color: #10b981; font-weight: 700; font-size: 13px; text-align: right;">${totalAmount}</td>
        </tr>
      `;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #059669, #0f766e); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SAAMPARK TECHNOLOGY</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE & BILLING DETAILS</p>
      </div>

      <div style="padding: 32px 36px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
          Please find below the invoice details for <strong style="color: #e2e8f0;">${project}</strong> issued by <strong>SAAMPARK TECHNOLOGY & RESEARCH PRIVATE LIMITED</strong>.
        </p>

        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Invoice Number:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #38bdf8; font-family: monospace;">${invoiceId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Invoice Date:</td>
              <td style="padding: 6px 0; text-align: right; color: #e2e8f0;">${billDate || new Date().toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Due Date:</td>
              <td style="padding: 6px 0; text-align: right; color: #f59e0b; font-weight: 600;">${dueDate || 'Immediate'}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #1e1e2e; border-bottom: 2px solid #2d2d3d;">
              <th style="padding: 10px 12px; color: #94a3b8; font-size: 11px; text-align: left; text-transform: uppercase;">Service</th>
              <th style="padding: 10px 12px; color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase;">Qty</th>
              <th style="padding: 10px 12px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase;">Rate</th>
              <th style="padding: 10px 12px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #94a3b8;">
            <span>Grand Total:</span>
            <strong style="color: #e2e8f0;">${totalAmount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #10b981;">
            <span>Amount Received:</span>
            <strong>${receivedAmount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #2d2d3d; font-size: 15px;">
            <span style="color: #f87171; font-weight: 700;">Balance Due:</span>
            <strong style="color: #f87171; font-size: 16px;">${dueAmount}</strong>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            View & Pay Digital Invoice →
          </a>
        </div>
      </div>

      <div style="padding: 20px 36px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">📞 +91 9901518567 / +91 9901518569 | 🌐 www.saamparktechnology.com</p>
        <p style="color: #475569; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK Invoicing" <supriyogod@gmail.com>',
    to,
    subject: `📄 Invoice ${invoiceId} for ${project} - Saampark Technology`,
    html,
  });
}

/**
 * Send project completion confirmation email
 */
async function sendProjectCompletionEmail({
  to,
  clientName = 'Valued Client',
  projectTitle,
  invoiceId = ''
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">🎉 Project Completed!</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">${projectTitle}</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          We are thrilled to let you know that your project <strong style="color: #38bdf8;">${projectTitle}</strong> has been successfully completed by our engineering and design team.
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #10b981; font-weight: 700; margin: 0 0 8px; font-size: 14px;">✔ All Milestones & Deliverables Fulfilled</p>
          <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5;">
            All requested features, documentation, and assets are now fully deployed and ready for your access.
          </p>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
          Thank you for choosing <strong>SAAMPARK Technology</strong>. If you need any assistance, reach out to our dedicated support.
        </p>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK Project Team" <supriyogod@gmail.com>',
    to,
    subject: `🚀 Project Completed: ${projectTitle} - Saampark Technology`,
    html,
  });
}

/**
 * Send client welcome & portal onboarding email
 */
async function sendClientWelcomeEmail({
  to,
  clientName = 'Valued Client',
  companyName = 'Client Company'
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Welcome to SAAMPARK! 👋</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Client Portal Access</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Welcome to <strong style="color: #818cf8;">SAAMPARK Group</strong>. Your client account has been registered for <strong style="color: #e2e8f0;">${companyName}</strong>.
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px; font-weight: 700;">Your Benefits</p>
          <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 0;">
            <li>Real-time project tracking & milestones</li>
            <li>Instant digital invoices and GST compliance</li>
            <li>Direct support tickets and communication</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
            Access Client Portal →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK Client Relations" <supriyogod@gmail.com>',
    to,
    subject: `👋 Welcome to Saampark Group - ${companyName}`,
    html,
  });
}

/**
 * Send payment receipt email (partial or full)
 */
async function sendPaymentReceiptEmail({
  to,
  clientName = 'Valued Client',
  invoiceId,
  project = 'Service',
  paidAmount,
  remainingDue = '₹0',
  nextDueDate = '-',
  paymentMethod = 'UPI',
  txnRef = ''
}) {
  const isZeroDue = remainingDue === '₹0' || remainingDue === '0' || remainingDue === '₹0.00';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">💳 Payment Receipt</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">${isZeroDue ? 'FULL PAYMENT SETTLED' : 'PART PAYMENT RECEIVED'}</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          We have successfully received and recorded your payment of <strong style="color: #10b981; font-size: 16px;">${paidAmount}</strong> for Invoice <strong style="color: #38bdf8;">${invoiceId}</strong> (${project}).
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Amount Paid:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #10b981;">${paidAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Payment Method:</td>
              <td style="padding: 6px 0; text-align: right; color: #e2e8f0;">${paymentMethod}</td>
            </tr>
            ${txnRef ? `<tr><td style="padding: 6px 0; color: #94a3b8;">Reference:</td><td style="padding: 6px 0; text-align: right; font-family: monospace; color: #94a3b8;">${txnRef}</td></tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Remaining Balance Due:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: ${isZeroDue ? '#10b981' : '#f87171'};">${remainingDue}</td>
            </tr>
            ${!isZeroDue && nextDueDate && nextDueDate !== '-' ? `<tr><td style="padding: 6px 0; color: #94a3b8;">Next Due Date:</td><td style="padding: 6px 0; text-align: right; color: #f59e0b; font-weight: 600;">${nextDueDate}</td></tr>` : ''}
          </table>
        </div>
        ${isZeroDue ? `
          <div style="background: #064e3b; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px;">
            <p style="color: #a7f3d0; font-size: 13px; margin: 0;">✨ Your invoice has been <strong>Fully Settled</strong> with ₹0 remaining balance. Thank you!</p>
          </div>
        ` : `
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
            Please ensure the remaining balance of ${remainingDue} is settled on or before ${nextDueDate}.
          </p>
        `}
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK Accounts" <supriyogod@gmail.com>',
    to,
    subject: `💳 Payment Receipt: ${paidAmount} Received for ${invoiceId}`,
    html,
  });
}

/**
 * Send payment due reminder email
 */
async function sendPaymentDueReminderEmail({
  to,
  clientName = 'Valued Client',
  invoiceId,
  project = 'Service',
  dueAmount,
  dueDate = 'Immediate'
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">⏰ Payment Reminder</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Invoice: ${invoiceId}</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          This is a friendly reminder that an outstanding payment of <strong style="color: #f59e0b; font-size: 16px;">${dueAmount}</strong> is pending for Invoice <strong style="color: #38bdf8;">${invoiceId}</strong> (${project}).
        </p>
        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Pending Amount Due:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #f59e0b; font-size: 15px;">${dueAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Due Date:</td>
              <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-weight: 600;">${dueDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">UPI ID for Settlement:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #38bdf8; font-weight: 700;">saampark@sbi</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center;">
          <a href="https://crm.saampark.com/sales/invoices?view=${invoiceId}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
            View Invoice & Settle Due →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"SAAMPARK Accounts" <supriyogod@gmail.com>',
    to,
    subject: `⏰ Payment Due Reminder: ${dueAmount} for ${invoiceId} - Saampark Technology`,
    html,
  });
}

module.exports = {
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  sendAdminCreatedAccountEmail,
  sendInvoiceDetailsEmail,
  sendProjectCompletionEmail,
  sendClientWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentDueReminderEmail,
  verifyOTP,
  generateOTP,
  storeOTP,
};



