const nodemailer = require('nodemailer');
const pool = require('../config/db');

// ─── Group Email Config (Saampark Group official for OTPs and Verification) ──
function getGroupEmailConfig() {
  const user = (process.env.GROUP_SMTP_USER || 'saampark.official@gmail.com').trim();
  const pass = (process.env.GROUP_SMTP_PASS || 'wtsydhlysuvldjdb').replace(/\s+/g, '');
  const host = (process.env.GROUP_SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.GROUP_SMTP_PORT || '587', 10);
  const fromName = 'SAAMPARK Group';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return {
    transporter,
    from: `"${fromName}" <${user}>`,
    fromEmail: user,
    fromName,
  };
}

/**
 * Resolve SMTP Transporter and From identity dynamically for a given company or global fallback
 */
async function getEmailConfig(companyId = null, overrideConfig = null) {
  // 1. If explicit config is provided (e.g. for connection testing or manual payload)
  if (overrideConfig && overrideConfig.user && overrideConfig.pass) {
    const host = (overrideConfig.host || 'smtp.gmail.com').trim();
    const port = parseInt(overrideConfig.port || '587', 10);
    const secure = overrideConfig.secure === true || overrideConfig.secure === 'true' || port === 465;
    const fromName = overrideConfig.fromName || 'SAAMPARK CRM';
    const fromEmail = overrideConfig.fromEmail || overrideConfig.user;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: overrideConfig.user.trim(),
        pass: overrideConfig.pass.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return {
      transporter,
      from: `"${fromName}" <${fromEmail}>`,
      fromEmail,
      fromName,
    };
  }

  // 2. If companyId provided, try to find Company's specific SMTP settings
  if (companyId && companyId !== 'all') {
    const canonId = String(companyId).toLowerCase().trim();
    try {
      const [compRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "companies"');
      if (compRows.length > 0) {
        const companies = JSON.parse(compRows[0].data_json);
        const comp = Array.isArray(companies) ? companies.find(c => {
          const cId = String(c.id || '').toLowerCase().trim();
          const cSlug = String(c.slug || '').toLowerCase().trim();
          const cNum = String(c.numeric_id || '').toLowerCase().trim();
          return cId === canonId || cSlug === canonId || cNum === canonId || (canonId.includes('consult') && (cId.includes('consult') || cSlug.includes('consult')));
        }) : null;
        if (comp && comp.smtp_user && comp.smtp_pass) {
          const host = (comp.smtp_host || 'smtp.gmail.com').trim();
          const port = parseInt(comp.smtp_port || '587', 10);
          const secure = comp.smtp_secure === true || comp.smtp_secure === 'true' || port === 465;
          const fromName = comp.smtp_from_name || comp.brand_name || comp.name || 'SAAMPARK CRM';
          const fromEmail = comp.smtp_from_email || comp.smtp_user;

          const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user: comp.smtp_user.trim(),
              pass: comp.smtp_pass.replace(/\s+/g, ''),
            },
            tls: {
              rejectUnauthorized: false,
            },
          });

          return {
            transporter,
            from: `"${fromName}" <${fromEmail}>`,
            fromEmail,
            fromName,
          };
        }

        // If this is Saampark Consultancy and company record didn't have pass, use default Consultancy credentials
        if (canonId === 'consultancy' || canonId === '2' || canonId.includes('consult') || (comp && String(comp.name || '').toLowerCase().includes('consult'))) {
          const consultUser = 'saamparkconsultancyservice@gmail.com';
          const consultPass = 'flrnjwhvghdeizdv';
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: consultUser, pass: consultPass },
            tls: { rejectUnauthorized: false },
          });
          return {
            transporter,
            from: `"SAAMPARK Consultancy Services" <${consultUser}>`,
            fromEmail: consultUser,
            fromName: 'SAAMPARK Consultancy Services',
          };
        }
      }
    } catch (err) {
      console.warn('Company SMTP lookup error:', err.message);
    }
  }

  // 3. Try to read Global Settings from DB (for Saampark Technology fallback)
  try {
    const [settingsRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "settings"');
    if (settingsRows.length > 0) {
      const settings = JSON.parse(settingsRows[0].data_json);
      if (settings && settings.smtpUser && settings.smtpPass) {
        const host = (settings.smtpHost || 'smtp.gmail.com').trim();
        const port = parseInt(settings.smtpPort || '587', 10);
        const secure = settings.smtpSecure === true || settings.smtpSecure === 'true' || port === 465;
        const fromName = settings.smtpFromName || settings.companyName || 'SAAMPARK Technology';
        const fromEmail = settings.smtpFromEmail || settings.smtpUser;

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user: settings.smtpUser.trim(),
            pass: settings.smtpPass.replace(/\s+/g, ''),
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        return {
          transporter,
          from: `"${fromName}" <${fromEmail}>`,
          fromEmail,
          fromName,
        };
      }
    }
  } catch (err) {
    console.warn('Global Settings SMTP lookup error:', err.message);
  }

  // 4. Default Fallback (for Saampark Technology & Research Private Limited)
  const defaultUser = process.env.SMTP_USER || 'saamparktechnologyresearch@gmail.com';
  const defaultPass = (process.env.SMTP_PASS || 'jvdnpuiozmqbiwtx').replace(/\s+/g, '');
  const defaultHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const defaultPort = parseInt(process.env.SMTP_PORT || '587', 10);

  const transporter = nodemailer.createTransport({
    host: defaultHost,
    port: defaultPort,
    secure: defaultPort === 465,
    auth: {
      user: defaultUser,
      pass: defaultPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return {
    transporter,
    from: `"SAAMPARK Technology & Research" <${defaultUser}>`,
    fromEmail: defaultUser,
    fromName: 'SAAMPARK Technology & Research Private Limited',
  };
}

// ─── OTP In-Memory Store ──────────────────────────────────────────────────────
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
 * Store OTP in memory
 */
function storeOTP(email, otp, type = 'reset') {
  otpStore.set(email.toLowerCase(), {
    otp,
    type,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });
}

/**
 * Verify OTP
 */
function verifyOTP(email, inputOtp) {
  const record = otpStore.get(email.toLowerCase());
  if (!record) {
    return { valid: false, error: 'OTP expired or not requested. Please request a new OTP.' };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
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
 * Test SMTP connection and send a test email
 */
async function testSmtpConnection(config) {
  const { host, port, secure, user, pass, fromName, fromEmail, testEmail, companyId, companyName } = config;
  const emailConfig = await getEmailConfig(companyId, { host, port, secure, user, pass, fromName, fromEmail });

  // 1. Verify credentials with SMTP server
  await emailConfig.transporter.verify();

  // 2. Send test email to target recipient
  const recipient = (testEmail || user || emailConfig.fromEmail).trim();
  const brandTitle = fromName || companyName || (String(companyId).includes('consult') ? 'SAAMPARK Consultancy' : 'SAAMPARK Technology');
  if (recipient) {
    const testHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">SMTP Test Successful! ✅</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">${brandTitle} - SMTP Connection Verified</p>
        </div>
        <div style="padding: 32px 40px; background: #16161e;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">Hello Administrator,</p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
            This email confirms that the dedicated SMTP configuration for <strong>${brandTitle}</strong> in <strong>SAAMPARK CRM</strong> is working and actively sending emails!
          </p>
          <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px;">
            <div style="color: #94a3b8; margin-bottom: 6px;"><strong>Company / Workspace:</strong> <span style="color: #38bdf8; font-weight: bold;">${brandTitle}</span></div>
            <div style="color: #94a3b8; margin-bottom: 6px;"><strong>SMTP Host:</strong> <span style="color: #38bdf8; font-family: monospace;">${config.host || 'smtp.gmail.com'}</span></div>
            <div style="color: #94a3b8; margin-bottom: 6px;"><strong>Sender User:</strong> <span style="color: #e2e8f0; font-family: monospace;">${config.user || emailConfig.fromEmail}</span></div>
            <div style="color: #94a3b8;"><strong>Timestamp:</strong> <span style="color: #10b981;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
            All automated invoice dispatches, quotations, estimates, OTP resets, and notifications for <strong>${brandTitle}</strong> will now be delivered through this authenticated SMTP account.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
          <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 ${brandTitle}. All rights reserved.</p>
        </div>
      </div>
    `;

    await emailConfig.transporter.sendMail({
      from: emailConfig.from,
      to: recipient,
      subject: `✅ ${brandTitle}: SMTP Test Connection Successful (${config.host || 'Gmail'})`,
      html: testHtml,
    });
  }

  return { success: true, message: `SMTP connection verified and test email successfully delivered to ${recipient} for ${brandTitle}` };
}

function getCompanyBranding(companyId, rawName = '') {
  const norm = String(companyId || rawName || '').toLowerCase();
  const isConsultancy = norm.includes('consult') || norm.includes('scs');
  if (isConsultancy) {
    return {
      fullName: 'SAAMPARK CONSULTANCY SERVICES PRIVATE LIMITED',
      shortName: 'SCS',
      displayName: 'SAAMPARK CONSULTANCY SERVICES (SCS)',
      phone: '+91 9901518567 / +91 9901518569',
      email: 'consultancy@saampark.com',
      website: 'www.saampark.com',
      office: 'City Centre, Durgapur, Paschim Bardhaman, WB - 713216'
    };
  }
  return {
    fullName: 'SAAMPARK TECHNOLOGY & RESEARCH PRIVATE LIMITED',
    shortName: 'STR',
    displayName: 'SAAMPARK TECHNOLOGY & RESEARCH (STR)',
    phone: '+91 9901518567 / +91 9901518569',
    email: 'contact@saamparktechnology.com',
    website: 'www.saamparktechnology.com',
    office: 'Webel IT Park, Phase II, Durgapur, WB - 713212'
  };
}

/**
 * Send OTP email for password reset (Uses Saampark Group Official Email)
 */
async function sendPasswordResetOTP(email, name = 'User', companyId = null) {
  const otp = generateOTP();
  storeOTP(email, otp, 'reset');

  const { transporter, from } = getGroupEmailConfig();
  const brand = getCompanyBranding(companyId);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
            ACCOUNT SECURITY • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Password Reset Code</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Use this one-time code to safely update your password</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            We received a verified request to reset the password for your account associated with <strong style="color: #f9fafb;">${brand.displayName}</strong>.
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 11.5px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">One-Time Security OTP</p>
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #818cf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 8px 0;">${otp}</div>
            <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px;">
              <span style="color: #fbbf24; font-size: 12px; font-weight: 600;">⏱ Valid for 10 minutes</span>
            </div>
          </div>

          <div style="background: rgba(99, 102, 241, 0.08); border-left: 4px solid #6366f1; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #c7d2fe; font-size: 12.5px; line-height: 1.5; margin: 0;">
              <strong>Security Alert:</strong> If you did not initiate this request, no action is needed. Your current password remains active and secure.
            </p>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: `🔐 Your Password Reset Code: ${otp} - ${brand.shortName}`,
    html,
  });

  return otp;
}

/**
 * Send OTP email for email verification after registration (Uses Saampark Group Official Email)
 */
async function sendEmailVerificationOTP(email, name = 'User', companyId = null) {
  const otp = generateOTP();
  storeOTP(email, otp, 'verify');

  const { transporter, from } = getGroupEmailConfig();
  const brand = getCompanyBranding(companyId);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
            ACCOUNT VERIFICATION • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Verify Your Email Address</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Confirm your email to complete registration</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Welcome, <strong>${name}</strong>! 🎉</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            Your account profile at <strong style="color: #f9fafb;">${brand.displayName}</strong> has been created. Please enter the verification code below to verify your email:
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 11.5px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">Verification Code</p>
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #34d399; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 8px 0;">${otp}</div>
            <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px;">
              <span style="color: #6ee7b7; font-size: 12px; font-weight: 600;">⏱ Valid for 10 minutes</span>
            </div>
          </div>

          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
            Once verified, you will be able to access your personalized workspace.
          </p>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: `✅ Verify Your Email: ${otp} - ${brand.shortName}`,
    html,
  });

  return otp;
}

/**
 * Send welcome email with credentials for admin-created accounts (bypasses OTP verification)
 */
async function sendAdminCreatedAccountEmail(email, name = 'Team Member', role = 'Teams', companyName = 'SAAMPARK Technology', tempPassword = '', companyId = null) {
  const { transporter, from } = await getEmailConfig(companyId);

  const isClient = role === 'Clients' || String(role).toLowerCase().includes('client');

  const clientHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0b1120; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #0284c7, #0f766e); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SAAMPARK CLIENT PORTAL</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px; font-weight: 600;">Official Client Access &amp; Workspace</p>
      </div>
      <div style="padding: 36px 40px; background: #0f172a;">
        <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Welcome to <strong style="color: #38bdf8;">${companyName}</strong>. Your dedicated Client Portal has been activated, providing secure 24/7 access to your projects, milestone progress, commercial billing, and direct communications.
        </p>

        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #38bdf8; font-size: 11.5px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; font-weight: 700;">Your Client Login Credentials</p>
          <div style="margin-bottom: 12px;">
            <span style="color: #94a3b8; font-size: 12px; display: block; margin-bottom: 4px;">Login Email:</span>
            <span style="color: #f8fafc; font-size: 15px; font-weight: 600; font-family: monospace;">${email}</span>
          </div>
          <div>
            <span style="color: #94a3b8; font-size: 12px; display: block; margin-bottom: 4px;">Temporary Password:</span>
            <span style="color: #fbbf24; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${tempPassword}</span>
          </div>
        </div>

        <div style="background: rgba(2, 132, 199, 0.08); border-left: 4px solid #0284c7; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #bae6fd; font-size: 13px; margin: 0 0 10px; font-weight: 700;">
            Features Available in Your Client Portal:
          </p>
          <ul style="color: #94a3b8; font-size: 12.5px; margin: 0; padding-left: 18px; line-height: 1.6;">
            <li>View real-time progress on your active <strong>Projects &amp; Deliverables</strong>.</li>
            <li>Review and download official <strong>Invoices, Quotations &amp; Estimates</strong>.</li>
            <li>Track commercial payment milestones, bank remittance details &amp; receipts.</li>
            <li>Access dedicated digital marketing analytics, live creatives &amp; performance reports.</li>
            <li>Raise priority support tickets and communicate directly with your project manager.</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #0f766e); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
            Sign In to Client Portal →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0b1120; text-align: center; border-top: 1px solid #1e293b;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  const employeeHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SAAMPARK CRM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">Employee Onboarding Portal</p>
      </div>
      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          An Administrator has registered your account at <strong style="color: #6366f1;">${companyName}</strong> with the designated role of <strong style="color: #10b981;">${role}</strong>.
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

        <div style="background: #1e1b4b; border-left: 4px solid #6366f1; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #c7d2fe; font-size: 13px; margin: 0 0 10px; font-weight: 700;">
            Required Onboarding Steps:
          </p>
          <ol style="color: #94a3b8; font-size: 12.5px; margin: 0; padding-left: 18px; line-height: 1.6;">
            <li>Sign in using your email and temporary password above.</li>
            <li>Configure your personal <strong>4-Digit Security PIN</strong>.</li>
            <li>Submit your <strong>Employee KYC Documents</strong> (Government Identity &amp; Bank Details).</li>
            <li>Branch Management will review your submission and notify you once full CRM access is unlocked.</li>
          </ol>
        </div>

        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">
            Sign In to SAAMPARK CRM →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: isClient 
      ? `Welcome to ${companyName} - Your Client Portal Login Credentials` 
      : `Welcome to ${companyName} - Account Credentials & Onboarding Steps`,
    html: isClient ? clientHtml : employeeHtml,
  });
}

/**
 * Send a welcome email to a newly registered user
 */
async function sendWelcomeEmail(email, name = 'Team Member', role = 'Teams', companyName = 'SAAMPARK Technology', companyId = null) {
  try {
    await sendAdminCreatedAccountEmail(email, name, role, companyName, '', companyId);
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
  viewUrl = `https://crm.saampark.com/sales/invoices?view=${invoiceId}`,
  downloadUrl = null,
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const effectiveDownloadUrl = downloadUrl || (viewUrl.includes('?') ? `${viewUrl}&action=download` : `${viewUrl}?action=download`);

  const itemsHtml = (items && items.length > 0)
    ? items.map(it => `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">${it.serviceName || project}</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">${it.qty || 1}</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.totalAmount || (it.rate || 0) * (it.qty || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">${project}</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">1</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
        </tr>
      `;

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #0f766e); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            TAX INVOICE • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Official Tax Invoice</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${brand.fullName}</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            Please find your official tax invoice details for <strong style="color: #f9fafb;">${project}</strong> issued by <strong>${brand.fullName}</strong>.
          </p>

          <!-- Metadata Box -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Invoice Number:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Issue Date:</td>
                <td style="padding: 6px 0; text-align: right; color: #f3f4f6;">${billDate || new Date().toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Payment Due Date:</td>
                <td style="padding: 6px 0; text-align: right; color: #fbbf24; font-weight: 600;">${dueDate || 'Immediate'}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <div style="border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; background-color: #161f30;">
              <thead>
                <tr style="background-color: #1e293b; border-bottom: 2px solid #334155;">
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: left; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Service / Item</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Qty</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Rate</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Commercial Total Box -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 28px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; color: #9ca3af;">
              <span>Grand Total:</span>
              <strong style="color: #f3f4f6; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; color: #34d399;">
              <span>Amount Received:</span>
              <strong style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${receivedAmount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #374151; font-size: 15px;">
              <span style="color: #f87171; font-weight: 700;">Balance Due:</span>
              <strong style="color: #f87171; font-size: 17px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${dueAmount}</strong>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin-bottom: 10px;">
            <a href="${viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
              💳 View &amp; Settle Invoice →
            </a>
            <a href="${effectiveDownloadUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
              📥 Download Verified PDF
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `📄 Tax Invoice ${invoiceId} for ${project} - ${brand.shortName}`,
    html,
  });
}

/**
 * Send quotation details with 3 response buttons + Download PDF
 */
async function sendQuotationDetailsEmail({
  to,
  clientName = 'Valued Client',
  quotationId,
  quotationNumber,
  totalAmount,
  validUntil = '',
  items = [],
  viewUrl,
  downloadUrl,
  acceptUrl,
  modifyUrl,
  declineUrl,
  adminName = 'SAAMPARK Admin',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const displayNum = quotationNumber || quotationId;
  const vUrl = viewUrl || `https://crm.saampark.com/public/quotation?id=${quotationId}`;
  const dUrl = downloadUrl || `${vUrl}&action=download`;
  const aUrl = acceptUrl || `${vUrl}&action=accept`;
  const mUrl = modifyUrl || `${vUrl}&action=modify`;
  const decUrl = declineUrl || `${vUrl}&action=decline`;

  const itemsHtml = (items && items.length > 0)
    ? items.map(it => `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">${it.name || it.serviceName || 'Item'}</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">${it.quantity || it.qty || 1}</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.unitPrice || it.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.total || it.totalAmount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">Commercial Scope Proposal</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">1</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
        </tr>
      `;

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            PROJECT PROPOSAL • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Official Commercial Quotation</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${brand.fullName}</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 20px;">
            We have prepared official Quotation <strong style="color: #38bdf8;">${displayNum}</strong> for your project requirements. Please review the commercial breakdown below and select your response:
          </p>

          <!-- Metadata Box -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Quotation Number:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${displayNum}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Prepared By:</td>
                <td style="padding: 6px 0; text-align: right; color: #f3f4f6;">${adminName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Valid Until:</td>
                <td style="padding: 6px 0; text-align: right; color: #fbbf24; font-weight: 600;">${validUntil || '30 Days from issue'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Total Commercial Value:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #34d399; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <div style="border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; background-color: #161f30;">
              <thead>
                <tr style="background-color: #1e293b; border-bottom: 2px solid #334155;">
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: left; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Item / Service</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Qty</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Rate</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Interactive Action Buttons -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0 16px;">
            <p style="color: #d1d5db; font-size: 13px; font-weight: 700; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.5px;">Please select your response:</p>
            
            <div style="margin-bottom: 14px;">
              <!-- Button 1: Accept -->
              <a href="${aUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);">
                ✅ Accept Quotation
              </a>
              <!-- Button 2: Need Modification -->
              <a href="${mUrl}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);">
                ✏️ Request Modification
              </a>
              <!-- Button 3: Decline / Don't Accept -->
              <a href="${decUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
                ❌ Decline
              </a>
            </div>

            <div style="border-top: 1px solid #374151; padding-top: 14px; margin-top: 14px;">
              <a href="${dUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 10px; font-weight: 700; font-size: 12px; margin: 4px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);">
                📥 Download Official PDF
              </a>
              <a href="${vUrl}" style="display: inline-block; background: #374151; color: #f3f4f6; text-decoration: none; padding: 10px 22px; border-radius: 10px; font-weight: 600; font-size: 12px; margin: 4px;">
                👁️ View Digital Portal
              </a>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            Upon acceptance, this quotation initiates the official project onboarding and estimation.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `📑 Commercial Quotation ${displayNum} (${totalAmount}) - ${brand.shortName}`,
    html,
  });
}

/**
 * Send estimate details with 3 response buttons + Download PDF
 */
async function sendEstimateDetailsEmail({
  to,
  clientName = 'Valued Client',
  estimateId,
  estimateNumber,
  projectTitle = 'Project Estimate',
  totalAmount,
  validUntil = '',
  items = [],
  viewUrl,
  downloadUrl,
  acceptUrl,
  modifyUrl,
  declineUrl,
  adminName = 'SAAMPARK Admin',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const displayNum = estimateNumber || estimateId;
  const vUrl = viewUrl || `https://crm.saampark.com/public/estimate?id=${estimateId}`;
  const dUrl = downloadUrl || `${vUrl}&action=download`;
  const aUrl = acceptUrl || `${vUrl}&action=accept`;
  const mUrl = modifyUrl || `${vUrl}&action=modify`;
  const decUrl = declineUrl || `${vUrl}&action=decline`;

  const itemsHtml = (items && items.length > 0)
    ? items.map(it => `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">${it.name || it.serviceName || 'Service'}</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">${it.quantity || it.qty || 1}</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.unitPrice || it.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">₹${(it.total || it.totalAmount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : `
        <tr style="border-bottom: 1px solid #1f2937;">
          <td style="padding: 12px 14px; color: #f3f4f6; font-size: 13px; font-weight: 500;">${projectTitle}</td>
          <td style="padding: 12px 14px; color: #9ca3af; font-size: 13px; text-align: center;">1</td>
          <td style="padding: 12px 14px; color: #d1d5db; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
          <td style="padding: 12px 14px; color: #34d399; font-weight: 700; font-size: 13px; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
        </tr>
      `;

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            PROJECT ESTIMATE • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Official Project Cost Estimate</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${brand.fullName}</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 20px;">
            Here is your official cost estimate <strong style="color: #38bdf8;">${displayNum}</strong> for <strong>${projectTitle}</strong>. Please review the itemized scope and choose your response:
          </p>

          <!-- Metadata Box -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Estimate Number:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${displayNum}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Project Title:</td>
                <td style="padding: 6px 0; text-align: right; color: #f3f4f6; font-weight: 600;">${projectTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Valid Until:</td>
                <td style="padding: 6px 0; text-align: right; color: #fbbf24; font-weight: 600;">${validUntil || '30 Days from issue'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Estimated Total:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #34d399; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${totalAmount}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <div style="border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; background-color: #161f30;">
              <thead>
                <tr style="background-color: #1e293b; border-bottom: 2px solid #334155;">
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: left; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Service / Scope</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Qty</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Rate</th>
                  <th style="padding: 12px 14px; color: #94a3b8; font-size: 11px; text-align: right; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Interactive Action Buttons -->
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0 16px;">
            <p style="color: #d1d5db; font-size: 13px; font-weight: 700; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.5px;">Please select your response:</p>
            
            <div style="margin-bottom: 14px;">
              <!-- Button 1: Accept -->
              <a href="${aUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);">
                ✅ Accept Estimate
              </a>
              <!-- Button 2: Need Modification -->
              <a href="${mUrl}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);">
                ✏️ Request Modification
              </a>
              <!-- Button 3: Decline / Don't Accept -->
              <a href="${decUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; margin: 4px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
                ❌ Decline
              </a>
            </div>

            <div style="border-top: 1px solid #374151; padding-top: 14px; margin-top: 14px;">
              <a href="${dUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 10px; font-weight: 700; font-size: 12px; margin: 4px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.35);">
                📥 Download Official PDF
              </a>
              <a href="${vUrl}" style="display: inline-block; background: #374151; color: #f3f4f6; text-decoration: none; padding: 10px 22px; border-radius: 10px; font-weight: 600; font-size: 12px; margin: 4px;">
                👁️ View Digital Portal
              </a>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            Upon acceptance, this estimate can be immediately converted into an official tax invoice and deliverables schedule.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `📋 Cost Estimate ${displayNum} for ${projectTitle} (${totalAmount}) - ${brand.shortName}`,
    html,
  });
}

/**
 * Send Security PIN verification OTP email
 */
async function sendPinResetOTP(email, name = 'User', companyId = null) {
  const otp = generateOTP();
  storeOTP(email, otp, 'pin_reset');

  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            SECURITY VERIFICATION • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Security PIN Verification</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Confirm your authorization to update your 4-digit security PIN</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb; text-align: center;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            Please enter the following 6-digit verification code in the CRM prompt to set or reset your 4-digit Security PIN:
          </p>
          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px 32px; display: inline-block; margin-bottom: 24px;">
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #a5b4fc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${otp}</div>
            <div style="display: inline-block; margin-top: 8px; padding: 3px 10px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px;">
              <span style="color: #fbbf24; font-size: 11.5px; font-weight: 600;">⏱ Expires in 10 minutes</span>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Never share this OTP with anyone. Management will never ask for your verification code.
          </p>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: `🔐 Security PIN Code: ${otp} - ${brand.shortName}`,
    html,
  });

  return { success: true, email };
}

/**
 * Send project completion confirmation email
 */
async function sendProjectCompletionEmail({
  to,
  clientName = 'Valued Client',
  projectTitle,
  invoiceId = '',
  planType = 'general',
  countdownDuration = '',
  countdownStartDate = '',
  countdownEndDate = '',
  countdownNotice = '',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);
  const isDigitalMarketing = planType === 'digital_marketing' || String(projectTitle).toLowerCase().includes('marketing');

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #0284c7, #2563eb); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            PROJECT MILESTONE • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">🎉 Project Successfully Completed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${projectTitle}</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            We are thrilled to inform you that all deliverables, engineering requirements, and milestones for <strong style="color: #38bdf8;">${projectTitle}</strong> have been successfully fulfilled and signed off by <strong>${brand.fullName}</strong>.
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <p style="color: #34d399; font-weight: 700; margin: 0 0 8px; font-size: 14px;">✔ 100% Technical Specifications Deployed</p>
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 ${countdownDuration || countdownEndDate ? '16px' : '0'}; line-height: 1.5;">
              All source assets, production builds, user documentation, and service credentials are now active and accessible in your Client Portal.
            </p>

            ${(countdownDuration || countdownEndDate) ? `
              <div style="border-top: 1px solid #374151; padding-top: 14px;">
                <p style="color: #38bdf8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin: 0 0 10px;">SERVICE COUNTDOWN &amp; TIMELINE</p>
                <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
                  ${countdownDuration ? `<tr><td style="padding: 4px 0; color: #9ca3af;">Service / Plan:</td><td style="padding: 4px 0; text-align: right; font-weight: 700; color: #ffffff;">${countdownDuration}</td></tr>` : ''}
                  ${countdownStartDate ? `<tr><td style="padding: 4px 0; color: #9ca3af;">Countdown Starts:</td><td style="padding: 4px 0; text-align: right; color: #34d399; font-weight: 600;">${countdownStartDate}</td></tr>` : ''}
                  ${countdownEndDate ? `<tr><td style="padding: 4px 0; color: #9ca3af;">Service Valid Until:</td><td style="padding: 4px 0; text-align: right; color: #fbbf24; font-weight: 700;">${countdownEndDate}</td></tr>` : ''}
                </table>
                <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0; line-height: 1.4;">
                  ${countdownNotice || (isDigitalMarketing ? 'Note: For Digital Marketing Retainers, the campaign timeline starts strictly from the 1st live published post date.' : 'Your warranty and hosting timeline has officially started from today\'s completion sign-off.')}
                </p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
              Access Your Project Workspace →
            </a>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `🚀 Project Completed: ${projectTitle} - ${brand.shortName}`,
    html,
  });
}

/**
 * Send client welcome & portal onboarding email
 */
async function sendClientWelcomeEmail({
  to,
  clientName = 'Valued Client',
  companyName = 'Client Company',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId, companyName);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #0284c7, #0f766e); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            CLIENT WORKSPACE • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Welcome to SAAMPARK Client Portal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Dedicated Client Relationship &amp; Billing Portal</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            Welcome to <strong style="color: #38bdf8;">${brand.fullName}</strong>. Your dedicated Client Portal is now active, providing 24/7 visibility into your projects, deliverables, milestones, and commercial agreements.
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <p style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; font-weight: 700;">Client Portal Privileges</p>
            <ul style="color: #d1d5db; font-size: 13px; line-height: 1.6; padding-left: 20px; margin: 0;">
              <li>Live milestone progress tracking &amp; deliverable verification</li>
              <li>Instant digital invoices, GST compliance &amp; payment receipts</li>
              <li>Direct project ticketing &amp; rapid technical communication</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #0f766e); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
              Access Client Portal →
            </a>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `👋 Welcome to ${brand.displayName} - Client Portal Access`,
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
  txnRef = '',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);
  const isZeroDue = remainingDue === '₹0' || remainingDue === '0' || remainingDue === '₹0.00';

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            PAYMENT SETTLEMENT • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Official Payment Receipt</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${isZeroDue ? 'FULL INVOICE SETTLEMENT' : 'PARTIAL SETTLEMENT RECORDED'}</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            We have successfully received and registered your payment of <strong style="color: #34d399; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${paidAmount}</strong> for Invoice <strong style="color: #38bdf8;">${invoiceId}</strong> (${project}).
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 7px 0; color: #9ca3af;">Amount Credited:</td>
                <td style="padding: 7px 0; text-align: right; font-weight: 700; color: #34d399; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${paidAmount}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #9ca3af;">Payment Method:</td>
                <td style="padding: 7px 0; text-align: right; color: #f3f4f6;">${paymentMethod}</td>
              </tr>
              ${txnRef ? `<tr><td style="padding: 7px 0; color: #9ca3af;">Transaction Reference:</td><td style="padding: 7px 0; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #38bdf8;">${txnRef}</td></tr>` : ''}
              <tr style="border-top: 1px solid #374151;">
                <td style="padding: 10px 0 4px; color: #9ca3af; font-weight: 600;">Remaining Balance:</td>
                <td style="padding: 10px 0 4px; text-align: right; font-weight: 800; color: ${isZeroDue ? '#34d399' : '#f87171'}; font-size: 15px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${remainingDue}</td>
              </tr>
              ${!isZeroDue && nextDueDate && nextDueDate !== '-' ? `<tr><td style="padding: 4px 0 0; color: #9ca3af;">Next Due Date:</td><td style="padding: 4px 0 0; text-align: right; color: #fbbf24; font-weight: 600;">${nextDueDate}</td></tr>` : ''}
            </table>
          </div>

          ${isZeroDue ? `
            <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #a7f3d0; font-size: 13px; margin: 0; line-height: 1.5;">✨ <strong>Invoice Fully Settled:</strong> Your commercial balance for this invoice is ₹0. Thank you for your partnership!</p>
            </div>
          ` : `
            <p style="color: #9ca3af; font-size: 12.5px; line-height: 1.5; margin: 0 0 20px;">
              Please ensure the remaining balance of <strong style="color: #f87171;">${remainingDue}</strong> is settled on or before ${nextDueDate}.
            </p>
          `}

          <div style="text-align: center; margin-bottom: 10px;">
            <a href="https://crm.saampark.com/sales/invoices?view=${invoiceId}" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 12px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              View Ledger &amp; Invoice →
            </a>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `💳 Payment Receipt: ${paidAmount} Received for ${invoiceId} - ${brand.shortName}`,
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
  dueDate = 'Immediate',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            PAYMENT DUE REMINDER • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Outstanding Payment Notice</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Invoice Reference: ${invoiceId}</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            This is a friendly reminder that a payment of <strong style="color: #fbbf24; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${dueAmount}</strong> is pending for Invoice <strong style="color: #38bdf8;">${invoiceId}</strong> (${project}).
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 7px 0; color: #9ca3af;">Pending Due Amount:</td>
                <td style="padding: 7px 0; text-align: right; font-weight: 800; color: #fbbf24; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${dueAmount}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #9ca3af;">Due Date:</td>
                <td style="padding: 7px 0; text-align: right; color: #f3f4f6; font-weight: 600;">${dueDate}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #9ca3af;">UPI Settlement ID:</td>
                <td style="padding: 7px 0; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #38bdf8; font-weight: 700;">saampark@sbi</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 10px;">
            <a href="https://crm.saampark.com/sales/invoices?view=${invoiceId}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
              View Invoice &amp; Settle Due →
            </a>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `⏰ Payment Due Reminder: ${dueAmount} for ${invoiceId} - ${brand.shortName}`,
    html,
  });
}

/**
 * Send Digital Marketing Retainer Expiry & Campaign Renewal Email
 */
async function sendRetainerExpiryEmail({
  to,
  clientName = 'Valued Client',
  invoiceId = '',
  packageName = 'Digital Marketing Retainer',
  durationText = '1 Month',
  firstPostDate = '',
  expiryDate = '',
  remainingDays = '',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const brand = getCompanyBranding(companyId);

  const html = `
    <div style="background-color: #0b0f19; padding: 32px 16px; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 36px 40px; text-align: center;">
          <div style="display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            CAMPAIGN RENEWAL NOTICE • ${brand.shortName}
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">Digital Marketing Retainer Expiring Soon</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">${packageName} (${durationText})</p>
        </div>
        <div style="padding: 36px 40px; background-color: #111827; color: #e5e7eb;">
          <p style="color: #f9fafb; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color: #9ca3af; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px;">
            Your ongoing Digital Marketing Monthly Retainer plan (<strong style="color: #a78bfa;">${packageName}</strong>) is nearing its scheduled campaign duration.
          </p>

          <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <p style="color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 12px; font-weight: 800;">RETAINER TIMELINE &amp; COUNTDOWN</p>
            <table style="width: 100%; font-size: 13px; color: #d1d5db; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Retainer Plan:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${packageName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Plan Duration:</td>
                <td style="padding: 6px 0; text-align: right; color: #f3f4f6;">${durationText}</td>
              </tr>
              ${firstPostDate ? `
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">1st Post (Start Date):</td>
                <td style="padding: 6px 0; text-align: right; color: #38bdf8; font-weight: 600;">${firstPostDate}</td>
              </tr>` : ''}
              ${expiryDate ? `
              <tr>
                <td style="padding: 6px 0; color: #9ca3af;">Scheduled Expiry:</td>
                <td style="padding: 6px 0; text-align: right; color: #fbbf24; font-weight: 700;">${expiryDate}</td>
              </tr>` : ''}
              ${remainingDays ? `
              <tr style="border-top: 1px solid #374151;">
                <td style="padding: 10px 0 4px; color: #9ca3af;">Remaining Campaign Time:</td>
                <td style="padding: 10px 0 4px; text-align: right; font-weight: 800; color: #f87171; font-size: 14px;">${remainingDays} Days Left</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="background: rgba(124, 58, 237, 0.1); border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #c4b5fd; font-size: 13px; margin: 0; line-height: 1.5;">
              💡 <strong>Maintain Campaign Momentum:</strong> To ensure uninterrupted creative posting, social media engagement, and lead generation without pausing ad sets, please confirm your upcoming month's retainer renewal.
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 12px;">
            <a href="https://crm.saampark.com/sales/invoices${invoiceId ? `?view=${invoiceId}` : ''}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 12px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
              Review Campaign &amp; Renew Retainer →
            </a>
          </div>
        </div>
        <div style="padding: 24px 36px; background-color: #0b0f19; text-align: center; border-top: 1px solid #1f2937;">
          <p style="color: #9ca3af; font-size: 12px; font-weight: 700; margin: 0 0 4px;">${brand.fullName}</p>
          <p style="color: #6b7280; font-size: 11.5px; margin: 0 0 6px;">📞 ${brand.phone} | 🌐 ${brand.website}</p>
          <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 SAAMPARK Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `🔔 Campaign Notice: Your ${packageName} Retainer is Expiring Soon - ${brand.shortName}`,
    html,
  });
}

/**
 * Send generic notification email
 */
async function sendGenericEmail({
  to,
  subject,
  html,
  clientName = 'Valued Client',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);

  await transporter.sendMail({
    from,
    to,
    subject: subject || 'Notification from SAAMPARK CRM',
    html: html || `<p>Hello ${clientName},</p><p>You have a new update in SAAMPARK CRM.</p>`,
  });
}

/**
 * Send KYC Verification Successful Email to Team Member
 */
async function sendKycSuccessEmail({
  to,
  name = 'Team Member',
  role = 'Teams',
  companyName = 'SAAMPARK Group',
  branchName = '',
  employeeId = '',
  docType = 'Government ID',
  docNumber = '',
  bankName = '',
  accountNumber = '',
  verifiedBy = 'Management',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);
  const maskedDoc = docNumber ? (docNumber.length > 4 ? `•••• •••• ${docNumber.slice(-4)}` : docNumber) : 'Verified';
  const maskedAcc = accountNumber ? (accountNumber.length > 4 ? `•••• •••• ${accountNumber.slice(-4)}` : accountNumber) : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 36px 40px; text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: rgba(255,255,255,0.2); font-size: 28px; margin-bottom: 12px;">✅</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">KYC VERIFICATION SUCCESSFUL</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px; font-weight: 600;">Welcome to ${companyName}!</p>
      </div>

      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 12px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Congratulations! Your Employee KYC verification documents and bank details have been officially reviewed and <strong style="color: #10b981;">APPROVED</strong> by ${verifiedBy}.
        </p>

        <div style="background: #1e1e2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
          <p style="color: #10b981; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; font-weight: 800;">VERIFIED CREDENTIALS SUMMARY</p>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Employee Name:</td>
              <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 600;">${name}</td>
            </tr>
            ${employeeId ? `
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Employee ID:</td>
              <td style="padding: 8px 0; text-align: right; color: #38bdf8; font-weight: 700; font-family: monospace;">${employeeId}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Designation / Role:</td>
              <td style="padding: 8px 0; text-align: right; color: #e2e8f0;">${role}</td>
            </tr>
            ${branchName ? `
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Allocated Branch:</td>
              <td style="padding: 8px 0; text-align: right; color: #e2e8f0;">${branchName}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Identity Document:</td>
              <td style="padding: 8px 0; text-align: right; color: #e2e8f0; font-weight: 600;">${docType} (${maskedDoc})</td>
            </tr>
            ${bankName ? `
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Salary Bank Account:</td>
              <td style="padding: 8px 0; text-align: right; color: #e2e8f0;">${bankName} ${maskedAcc ? `(${maskedAcc})` : ''}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Verification Status:</td>
              <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 700;">VERIFIED & ACTIVE</td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
          <p style="color: #a7f3d0; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong>Full Access Unlocked:</strong> Your CRM workspace is now active. You can log in using your registered email and your 4-digit Security PIN to access assigned projects, clients, and operational tools.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            Enter CRM Workspace →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `KYC Verification Approved - Welcome to ${companyName}`,
    html,
  });
}

/**
 * Send KYC Rejection Email with reason
 */
async function sendKycRejectedEmail({
  to,
  name = 'Team Member',
  rejectionReason = 'Document details could not be verified.',
  companyName = 'SAAMPARK Group',
  companyId = null,
}) {
  const { transporter, from } = await getEmailConfig(companyId);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f0f13; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
      <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 36px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">KYC VERIFICATION UPDATE REQUIRED</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">${companyName} - Employee Verification</p>
      </div>

      <div style="padding: 36px 40px; background: #16161e;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 12px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Your submitted KYC verification documents were reviewed by management. However, some items could not be approved due to the following reason:
        </p>

        <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <p style="color: #fca5a5; font-size: 13px; margin: 0; font-weight: 600; line-height: 1.5;">
            Reason for Rejection:
          </p>
          <p style="color: #ffffff; font-size: 14px; margin: 6px 0 0; font-weight: bold;">
            "${rejectionReason}"
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
          Please sign in to your account, review the rejection note, and re-upload the correct document copies. Once re-submitted, your file will be re-evaluated promptly.
        </p>

        <div style="text-align: center;">
          <a href="https://crm.saampark.com/login" style="display: inline-block; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 14px;">
            Sign In & Re-upload Documents →
          </a>
        </div>
      </div>
      <div style="padding: 20px 40px; background: #0f0f13; text-align: center; border-top: 1px solid #1e1e2e;">
        <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `KYC Document Verification Update - Action Required (${companyName})`,
    html,
  });
}

module.exports = {
  getEmailConfig,
  testSmtpConnection,
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  sendAdminCreatedAccountEmail,
  sendInvoiceDetailsEmail,
  sendQuotationDetailsEmail,
  sendEstimateDetailsEmail,
  sendPinResetOTP,
  sendProjectCompletionEmail,
  sendClientWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentDueReminderEmail,
  sendRetainerExpiryEmail,
  sendGenericEmail,
  sendKycSuccessEmail,
  sendKycRejectedEmail,
  verifyOTP,
  generateOTP,
  storeOTP,
};



