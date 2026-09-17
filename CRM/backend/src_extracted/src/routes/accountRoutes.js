const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { transactionController, bankAccountController, chartOfAccountsController, categoryController, taxRateController } = require('../controllers/accountController');

router.use(authenticate);

// Transactions
router.get('/transactions', transactionController.getAll);
router.get('/transactions/summary', transactionController.getSummary);
router.get('/transactions/:id', transactionController.getById);
router.post('/transactions', transactionController.create);
router.delete('/transactions/:id', transactionController.delete);

// Bank Accounts
router.get('/bank-accounts', bankAccountController.getAll);
router.get('/bank-accounts/:id', bankAccountController.getById);
router.post('/bank-accounts', bankAccountController.create);
router.put('/bank-accounts/:id', bankAccountController.update);
router.delete('/bank-accounts/:id', bankAccountController.delete);

// Chart of Accounts
router.get('/chart-of-accounts', chartOfAccountsController.getAll);
router.post('/chart-of-accounts', chartOfAccountsController.create);
router.put('/chart-of-accounts/:id', chartOfAccountsController.update);
router.delete('/chart-of-accounts/:id', chartOfAccountsController.delete);

// Categories
router.get('/categories', categoryController.getAll);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Tax Rates
router.get('/tax-rates', taxRateController.getAll);
router.post('/tax-rates', taxRateController.create);
router.put('/tax-rates/:id', taxRateController.update);
router.delete('/tax-rates/:id', taxRateController.delete);

module.exports = router;
