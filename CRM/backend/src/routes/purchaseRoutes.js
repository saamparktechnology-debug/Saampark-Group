const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { purchaseOrderController, purchaseInvoiceController, purchaseReturnController } = require('../controllers/purchaseController');

router.use(authenticate);

router.get('/orders', purchaseOrderController.getAll);
router.get('/orders/:id', purchaseOrderController.getById);
router.post('/orders', purchaseOrderController.create);
router.put('/orders/:id', purchaseOrderController.update);
router.delete('/orders/:id', purchaseOrderController.delete);

router.get('/invoices', purchaseInvoiceController.getAll);
router.get('/invoices/:id', purchaseInvoiceController.getById);
router.post('/invoices', purchaseInvoiceController.create);
router.put('/invoices/:id', purchaseInvoiceController.update);
router.delete('/invoices/:id', purchaseInvoiceController.delete);

router.get('/returns', purchaseReturnController.getAll);
router.post('/returns', purchaseReturnController.create);
router.put('/returns/:id', purchaseReturnController.update);

module.exports = router;
