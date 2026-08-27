const express = require('express');
const router = express.Router();
const {
  sendInvoiceDetailsEmail,
  sendProjectCompletionEmail,
  sendClientWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentDueReminderEmail,
} = require('../utils/emailService');

router.post('/send-invoice', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, billDate, dueDate, totalAmount, receivedAmount, dueAmount, items, viewUrl } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendInvoiceDetailsEmail({ to, clientName, invoiceId, project, billDate, dueDate, totalAmount, receivedAmount, dueAmount, items, viewUrl });
    res.status(200).json({ status: 'success', message: `Invoice email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

router.post('/send-completion', async (req, res, next) => {
  try {
    const { to, clientName, projectTitle, invoiceId } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendProjectCompletionEmail({ to, clientName, projectTitle, invoiceId });
    res.status(200).json({ status: 'success', message: `Completion email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

router.post('/send-welcome', async (req, res, next) => {
  try {
    const { to, clientName, companyName } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendClientWelcomeEmail({ to, clientName, companyName });
    res.status(200).json({ status: 'success', message: `Welcome email successfully sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

router.post('/send-payment-receipt', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, paidAmount, remainingDue, nextDueDate, paymentMethod, txnRef } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendPaymentReceiptEmail({ to, clientName, invoiceId, project, paidAmount, remainingDue, nextDueDate, paymentMethod, txnRef });
    res.status(200).json({ status: 'success', message: `Payment receipt email sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

router.post('/send-reminder', async (req, res, next) => {
  try {
    const { to, clientName, invoiceId, project, dueAmount, dueDate } = req.body;
    if (!to) {
      return res.status(400).json({ status: 'error', message: 'Recipient email is required' });
    }
    await sendPaymentDueReminderEmail({ to, clientName, invoiceId, project, dueAmount, dueDate });
    res.status(200).json({ status: 'success', message: `Payment due reminder email sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
