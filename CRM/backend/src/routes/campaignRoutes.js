const express = require('express');
const router = express.Router();
const { createCampaign, getAllCampaigns } = require('../controllers/campaignController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticate, getAllCampaigns);
router.post('/', authenticate, requireRole(1, 2), createCampaign);

module.exports = router;
