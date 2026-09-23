const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { quotationController, estimateController, salesOrderController, paymentController, creditNoteController, debitNoteController, invoiceController } = require('../controllers/salesController');

router.use(authenticate);

// Quotations
router.get('/quotations', quotationController.getAll);
router.get('/quotations/:id', quotationController.getById);
router.post('/quotations', quotationController.create);
router.put('/quotations/:id', quotationController.update);
router.delete('/quotations/:id', quotationController.delete);
router.post('/quotations/:id/convert-to-invoice', quotationController.convertToInvoice);

// Estimates
router.get('/estimates', estimateController.getAll);
router.get('/estimates/:id', estimateController.getById);
router.post('/estimates', estimateController.create);
router.put('/estimates/:id', estimateController.update);
router.delete('/estimates/:id', estimateController.delete);

// Sales Orders
router.get('/sales-orders', salesOrderController.getAll);
router.get('/sales-orders/:id', salesOrderController.getById);
router.post('/sales-orders', salesOrderController.create);
router.put('/sales-orders/:id', salesOrderController.update);
router.delete('/sales-orders/:id', salesOrderController.delete);

// Payments
router.get('/payments', paymentController.getAll);
router.get('/payments/:id', paymentController.getById);
router.post('/payments', paymentController.create);
router.delete('/payments/:id', paymentController.delete);

// Credit Notes
router.get('/credit-notes', creditNoteController.getAll);
router.post('/credit-notes', creditNoteController.create);
router.put('/credit-notes/:id', creditNoteController.update);

// Debit Notes
router.get('/debit-notes', debitNoteController.getAll);
router.post('/debit-notes', debitNoteController.create);
router.put('/debit-notes/:id', debitNoteController.update);


// Invoices
router.get('/invoices', invoiceController.getAll);
router.get('/invoices/:id', invoiceController.getById);
router.post('/invoices', invoiceController.create);
router.put('/invoices/:id', invoiceController.update);
router.delete('/invoices/:id', invoiceController.delete);

module.exports = router;
