const express = require('express');
const router = express.Router();
const {
  getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany, getCompanyMembers
} = require('../controllers/companyController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// All require authentication
router.get('/', authenticate, getAllCompanies);
router.get('/:id', authenticate, getCompanyById);
router.get('/:id/members', authenticate, requireRole(1, 2), getCompanyMembers);

// Super Admin can create/delete companies
router.post('/', authenticate, requireRole(1), createCompany);
router.put('/:id', authenticate, requireRole(1, 2), updateCompany);
router.delete('/:id', authenticate, requireRole(1), deleteCompany);

module.exports = router;
