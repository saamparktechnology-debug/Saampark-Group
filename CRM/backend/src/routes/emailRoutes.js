const express = require('express');
const router = express.Router();
const {
  testSmtpConnection,
  sendInvoiceDetailsEmail,
  sendProjectCompletionEmail,
  sendClientWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentDueReminderEmail,
  sendGenericEmail,
} = require('../utils/emailService');

// ─── TEST SMTP CONNECTION ───────────────────────────────────────────────────
router.post('/test-connection', async (req, res, next) => {
  try {
    const { host, port, secure, user, pass, fromName, fromEmail, testEmail, companyId, company_id, companyName } = req.body;
    const targetCompId = companyId || company_id || null;

    if (!user || !pass) {
      return res.status(400).json({ status: 'error', message: 'SMTP Username/Email and App Password are required for testing.' });
    }

    const result = await testSmtpConnection({
      host: host || 'smtp.gmail.com',
      port: port || '587',
      secure,
      user,
      pass,
      fromName,
      fromEmail,
      testEmail,
      companyId: targetCompId,
      companyName,
    });

    res.status(200).json({ status: 'success', message: result.message });
  } catch (err) {
    console.error('SMTP Connection Test Error:', err);
    res.status(400).json({
      status: 'error',
      message: `SMTP Authentication Failed: ${err.message || 'Please check your Google App Password or Host credentials.'}`,
    });
  }
});

// ─── SAVE COMPANY SMTP CONFIG ──────────────────────────────────────────────
router.post('/company-config', async (req, res, next) => {
  try {
    const pool = require('../config/db');
    const { companyId, host, port, secure, user, pass, fromName, fromEmail } = req.body;
    if (!companyId) {
      return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
    }

    const [compRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "companies"');
    let companies = [];
    if (compRows.length > 0 && compRows[0].data_json) {
      try {
        companies = JSON.parse(compRows[0].data_json) || [];
      } catch {}
    }

    const canonId = String(companyId).toLowerCase().trim();
    const compIndex = companies.findIndex(c => 
      String(c.id || '').toLowerCase().trim() === canonId || 
      String(c.slug || '').toLowerCase().trim() === canonId ||
      String(c.numeric_id || '').toLowerCase().trim() === canonId
    );

    if (compIndex >= 0) {
      companies[compIndex] = {
        ...companies[compIndex],
        smtp_host: host,
        smtp_port: port,
        smtp_secure: secure,
        smtp_user: user,
        smtp_pass: pass,
        smtp_from_name: fromName,
        smtp_from_email: fromEmail,
      };
    } else {
      companies.push({
        id: companyId,
        slug: companyId,
        name: fromName || companyId,
        smtp_host: host,
        smtp_port: port,
        smtp_secure: secure,
        smtp_user: user,
        smtp_pass: pass,
        smtp_from_name: fromName,
        smtp_from_email: fromEmail,
      });
    }

    await pool.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES ("companies", ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [JSON.stringify(companies)]
    );

    return res.status(200).json({ status: 'success', message: `SMTP configuration saved for company ${companyId}` });
  } catch (err) {
    next(err);
  }
});

// ─── SAVE LEGACY / GLOBAL SMTP CONFIG ──────────────────────────────────────
router.post('/config', async (req, res, next) => {
  try {
    const pool = require('../config/db');
    const { host, port, secure, user, pass, fromName, fromEmail, companyId } = req.body;

    if (companyId && companyId !== 'all') {
      const [compRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "companies"');
      let companies = [];
      if (compRows.length > 0 && compRows[0].data_json) {
        try { companies = JSON.parse(compRows[0].data_json) || []; } catch {}
      }
      const canonId = String(companyId).toLowerCase().trim();
      const compIndex = companies.findIndex(c => String(c.id || '').toLowerCase() === canonId || String(c.slug || '').toLowerCase() === canonId);
      if (compIndex >= 0) {
        companies[compIndex] = {
          ...companies[compIndex],
          smtp_host: host,
          smtp_port: port,
          smtp_secure: secure,
          smtp_user: user,
          smtp_pass: pass,
          smtp_from_name: fromName,
          smtp_from_email: fromEmail,
        };
        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ("companies", ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify(companies)]
        );
      }
    }

    await pool.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES ("settings", ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [JSON.stringify({ smtpHost: host, smtpPort: port, smtpSecure: secure, smtpUser: user, smtpPass: pass, smtpFromName: fromName, smtpFromEmail: fromEmail })]
    );

    return res.status(200).json({ status: 'success', message: 'SMTP settings saved successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── SEND INVOICE ────────────────────────────────────────────────────────────
router.post('/send-invoice', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, billDate, dueDate, totalAmount, receivedAmount, dueAmount, items, viewUrl, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendInvoiceDetailsEmail({
      to,
      clientName,
      invoiceId,
      project,
      billDate,
      dueDate,
      totalAmount,
      receivedAmount,
      dueAmount,
      items,
      viewUrl,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Invoice email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND PROJECT COMPLETION ────────────────────────────────────────────────
router.post('/send-completion', async (req, res, next) => {
  try {
    const { to, clientName, projectTitle, invoiceId, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendProjectCompletionEmail({
      to,
      clientName,
      projectTitle,
      invoiceId,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Completion email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND WELCOME EMAIL ─────────────────────────────────────────────────────
router.post('/send-welcome', async (req, res, next) => {
  try {
    const { to, clientName, companyName, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendClientWelcomeEmail({
      to,
      clientName,
      companyName,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Welcome email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND PAYMENT RECEIPT ───────────────────────────────────────────────────
router.post('/send-payment-receipt', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, paidAmount, remainingDue, nextDueDate, paymentMethod, txnRef, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendPaymentReceiptEmail({
      to,
      clientName,
      invoiceId,
      project,
      paidAmount,
      remainingDue,
      nextDueDate,
      paymentMethod,
      txnRef,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Payment receipt email sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND PAYMENT DUE REMINDER ──────────────────────────────────────────────
router.post('/send-reminder', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, dueAmount, dueDate, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendPaymentDueReminderEmail({
      to,
      clientName,
      invoiceId,
      project,
      dueAmount,
      dueDate,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Payment due reminder email sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND GENERAL NOTIFICATION EMAIL ────────────────────────────────────────
router.post('/send-general', async (req, res, next) => {
  try {
    const { to, subject, html, clientName, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendGenericEmail({
      to,
      subject,
      html,
      clientName,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `General notification email sent to ${to}` });
  } catch (err) {
    next(err);
  }
});


// ─── GET & SAVE GLOBAL SMTP SETTINGS ──────────────────────────────────────
router.get('/settings', async (req, res, next) => {
  try {
    const pool = require('../config/db');
    const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "settings"');
    if (rows.length > 0) {
      const data = JSON.parse(rows[0].data_json);
      return res.status(200).json({ status: 'success', data });
    }
    return res.status(200).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const pool = require('../config/db');
    const payload = req.body;
    await pool.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES ("settings", ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return res.status(200).json({ status: 'success', message: 'SMTP settings saved successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

