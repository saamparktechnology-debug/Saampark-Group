const express = require('express');
const router = express.Router();
const { getSuperAdminStats, getRecentActivity } = require('../controllers/dashboardController');

router.get('/super-admin/stats', getSuperAdminStats);
router.get('/super-admin/recent-activity', getRecentActivity);

module.exports = router;
