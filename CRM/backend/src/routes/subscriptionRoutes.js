const express = require('express');
const router = express.Router();
const {
  getPackages,
  subscribeCustomer,
  getSubscriptions,
  changeStatus
} = require('../controllers/subscriptionController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/packages', authenticate, getPackages);
router.post('/subscribe', authenticate, requireRole(1, 2, 3, 4), subscribeCustomer);
router.get('/', authenticate, getSubscriptions);
router.patch('/:id/status', authenticate, requireRole(1, 2), changeStatus);

module.exports = router;
