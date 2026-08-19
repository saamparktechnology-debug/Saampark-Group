const express = require('express');
const router = express.Router();
const { createDeal, getAllDeals, updateDealStage } = require('../controllers/dealController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticate, getAllDeals);
router.post('/', authenticate, requireRole(1, 2, 3), createDeal);
router.patch('/:id/stage', authenticate, requireRole(1, 2, 3), updateDealStage);

module.exports = router;
