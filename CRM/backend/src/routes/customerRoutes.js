const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers, getCustomerById } = require('../controllers/customerController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, getCustomerById);
router.post('/', authenticate, requireRole(1, 2, 3), createCustomer);

module.exports = router;