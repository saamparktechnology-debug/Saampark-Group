const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/reportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/dashboard', authenticate, getDashboardOverview);

module.exports = router;
