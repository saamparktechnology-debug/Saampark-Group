const express = require('express');
const router = express.Router();
const { createLead, getAllLeads, getLeadById, updateLead, convertLeadToCustomer } = require('../controllers/leadController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// All lead routes require authentication
router.get('/', authenticate, getAllLeads);
router.get('/:id', authenticate, getLeadById);
router.post('/', authenticate, requireRole(1, 2, 3), createLead);
router.put('/:id', authenticate, requireRole(1, 2, 3), updateLead);
router.delete('/:id', authenticate, requireRole(1, 2), deleteLead);
router.post('/:id/convert', authenticate, requireRole(1, 2, 3), convertLeadToCustomer);

// Soft delete helper (not in controller yet, will fallback gracefully)
function deleteLead(req, res) {
  const { id } = req.params;
  const pool = require('../config/db');
  const { successResponse } = require('../utils/apiResponse');
  pool.execute('DELETE FROM leads WHERE id = ?', [id])
    .then(() => successResponse(res, 200, 'Lead deleted successfully'))
    .catch((err) => res.status(500).json({ status: 'error', message: err.message }));
}

module.exports = router;