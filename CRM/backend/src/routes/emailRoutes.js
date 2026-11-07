const express = require('express');
const router = express.Router();
const {
  testSmtpConnection,
  sendInvoiceDetailsEmail,
  sendQuotationDetailsEmail,
  sendEstimateDetailsEmail,
  sendProjectCompletionEmail,
  sendClientWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentDueReminderEmail,
  sendGenericEmail,
  sendKycSuccessEmail,
  sendKycRejectedEmail,
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

// ─── SEND QUOTATION ──────────────────────────────────────────────────────────
router.post('/send-quotation', async (req, res, next) => {
  try {
    const { to, clientName, quotationId, quotationNumber, projectTitle, date, validTill, totalAmount, items, viewUrl, downloadUrl, acceptUrl, modifyUrl, declineUrl, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendQuotationDetailsEmail({
      to,
      clientName,
      quotationId,
      quotationNumber,
      projectTitle,
      date,
      validTill,
      totalAmount,
      items,
      viewUrl,
      downloadUrl,
      acceptUrl,
      modifyUrl,
      declineUrl,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Quotation email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── SEND ESTIMATE ───────────────────────────────────────────────────────────
router.post('/send-estimate', async (req, res, next) => {
  try {
    const { to, clientName, estimateId, estimateNumber, projectTitle, date, validTill, totalAmount, items, viewUrl, downloadUrl, acceptUrl, modifyUrl, declineUrl, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendEstimateDetailsEmail({
      to,
      clientName,
      estimateId,
      estimateNumber,
      projectTitle,
      date,
      validTill,
      totalAmount,
      items,
      viewUrl,
      downloadUrl,
      acceptUrl,
      modifyUrl,
      declineUrl,
      companyId: companyId || company_id || null,
    });
    res.status(200).json({ status: 'success', message: `Estimate email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

// ─── CLIENT DOCUMENT RESPONSE (INTERACTIVE EMAIL ACTION) ─────────────────────
const handleDocumentResponse = async (req, res, next) => {
  try {
    const type = (req.query.type || req.body.type || 'quotation').toLowerCase().trim();
    const id = req.query.id || req.body.id || req.query.view;
    const action = (req.query.action || req.body.action || 'accept').toLowerCase().trim();
    const comment = req.query.comment || req.body.comment || '';
    const pool = require('../config/db');

    if (!id) {
      return res.status(400).send('Document ID is required.');
    }

    let statusText = '';
    let isAccepted = false;
    let isModification = false;
    let isDeclined = false;

    if (action.includes('accept') || action === 'approve') {
      isAccepted = true;
      statusText = type === 'estimate' ? 'Approved' : 'Accepted';
    } else if (action.includes('mod') || action === 'change') {
      isModification = true;
      statusText = 'Modification Requested';
    } else {
      isDeclined = true;
      statusText = type === 'estimate' ? 'Rejected' : 'Declined';
    }

    const table = type === 'estimate' ? 'estimates' : 'quotations';
    const numCol = type === 'estimate' ? 'estimate_number' : 'quotation_number';

    // 1. Update SQL table
    let docRecord = null;
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ? OR ${numCol} = ?`, [id, id]);
      if (rows.length > 0) {
        docRecord = rows[0];
        await pool.execute(
          `UPDATE ${table} SET status = ?, updated_at = NOW() WHERE id = ?`,
          [statusText, docRecord.id]
        );
      }
    } catch (sqlErr) {
      console.warn(`SQL update for ${table} client response:`, sqlErr.message);
    }

    // 2. Sync to app_data JSON store
    const moduleKey = type === 'estimate' ? 'estimates' : 'quotations';
    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [moduleKey]);
      if (appRows.length > 0) {
        let list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          const idx = list.findIndex(item => String(item.id) === String(id) || String(item.number) === String(id));
          if (idx >= 0) {
            list[idx].status = statusText;
            list[idx].client_status = statusText;
            list[idx].clientAccepted = isAccepted;
            list[idx].clientDeclined = isDeclined;
            list[idx].modificationRequested = isModification;
            list[idx].client_response_at = new Date().toISOString();
            if (comment) list[idx].client_comment = comment;
            await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = ?', [JSON.stringify(list), moduleKey]);
          }
        }
      }
    } catch (appErr) {
      console.warn(`app_data sync for ${moduleKey} response:`, appErr.message);
    }

    // 3. Create Notification for Specific Admin
    const docDisplayNum = docRecord ? (docRecord[numCol] || docRecord.number || id) : id;
    const clientName = docRecord?.customer || docRecord?.client_name || 'Client';
    const notifTitle = `${type === 'estimate' ? 'Estimate' : 'Quotation'} ${docDisplayNum}: ${statusText}`;
    const notifMsg = `${clientName} has chosen: "${statusText.toUpperCase()}" for ${type === 'estimate' ? 'Estimate' : 'Quotation'} ${docDisplayNum}.${comment ? ` Note: "${comment}"` : ''}`;

    try {
      await pool.execute(
        `INSERT INTO notifications (company_id, user_id, title, message, type, module_type, module_id, created_at)
         VALUES (?, ?, ?, ?, 'sales', ?, ?, NOW())`,
        [docRecord?.company_id || 'tech', docRecord?.created_by || null, notifTitle, notifMsg, type, docRecord?.id || id]
      );
    } catch {}

    // If client requested via API JSON (e.g. from frontend)
    if (req.headers['accept']?.includes('application/json') || req.body?.action) {
      return res.status(200).json({
        status: 'success',
        message: `Response "${statusText}" recorded successfully for ${docDisplayNum}`,
        statusText,
        isAccepted,
        isModification,
        isDeclined,
      });
    }

    // Otherwise render branded HTML confirmation page for email clicks
    const badgeColor = isAccepted ? '#10b981' : (isModification ? '#f59e0b' : '#ef4444');
    const badgeBg = isAccepted ? 'rgba(16, 185, 129, 0.15)' : (isModification ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)');
    const iconSymbol = isAccepted ? '✅' : (isModification ? '✏️' : '❌');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Response Confirmed - SAAMPARK CRM</title>
        <style>
          body { margin: 0; padding: 0; background: #09090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: #13131c; border: 1px solid #232332; border-radius: 20px; max-width: 480px; width: 90%; padding: 40px 30px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
          .icon { font-size: 52px; margin-bottom: 16px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeColor}; }
          h2 { margin: 0 0 10px; font-size: 24px; font-weight: 800; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 28px; }
          .meta { background: #1c1c28; border-radius: 12px; padding: 14px; margin-bottom: 24px; font-size: 13px; text-align: left; }
          .meta-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .meta-label { color: #64748b; }
          .meta-val { color: #e2e8f0; font-weight: 600; font-family: monospace; }
          .btn { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${iconSymbol}</div>
          <div class="badge">${statusText}</div>
          <h2>Thank You!</h2>
          <p>Your response has been successfully recorded. Our management team has been immediately notified.</p>
          <div class="meta">
            <div class="meta-row">
              <span class="meta-label">Document:</span>
              <span class="meta-val">${docDisplayNum} (${type.toUpperCase()})</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Status:</span>
              <span class="meta-val" style="color: ${badgeColor};">${statusText}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Timestamp:</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
          </div>
          <a href="https://crm.saampark.com" class="btn">Return to SAAMPARK Portal</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
};

router.get('/respond', handleDocumentResponse);
router.post('/respond', handleDocumentResponse);

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


// ─── SEND KYC STATUS NOTIFICATION EMAIL ────────────────────────────────────
router.post('/send-kyc-status', async (req, res, next) => {
  try {
    const { to, status, name, role, companyName, branchName, employeeId, docType, docNumber, bankName, accountNumber, verifiedBy, rejectionReason, companyId, company_id } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }

    if (String(status).toLowerCase() === 'verified') {
      await sendKycSuccessEmail({
        to,
        name: name || 'Team Member',
        role: role || 'Teams',
        companyName: companyName || 'SAAMPARK Group',
        branchName: branchName || '',
        employeeId: employeeId || '',
        docType: docType || 'Government ID',
        docNumber: docNumber || '',
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        verifiedBy: verifiedBy || 'Management',
        companyId: companyId || company_id || null,
      });
      return res.status(200).json({ status: 'success', message: `KYC verified email sent successfully to ${to}` });
    } else {
      await sendKycRejectedEmail({
        to,
        name: name || 'Team Member',
        rejectionReason: rejectionReason || 'Document details could not be verified. Please re-upload clear copies.',
        companyName: companyName || 'SAAMPARK Group',
        companyId: companyId || company_id || null,
      });
      return res.status(200).json({ status: 'success', message: `KYC rejection notice sent to ${to}` });
    }
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

