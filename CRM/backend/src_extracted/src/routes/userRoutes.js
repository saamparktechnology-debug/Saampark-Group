const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser, createUser } = require('../controllers/userController');
const { authenticate, requireRole, optionalAuth } = require('../middlewares/authMiddleware');

// GET all users
router.get('/', optionalAuth, getAllUsers);

// CREATE user (Admin/Super Admin) — Bypasses OTP, sends welcome credentials email
router.post('/', optionalAuth, createUser);

// GET single user
router.get('/:id', optionalAuth, getUserById);

// UPDATE user
router.put('/:id', optionalAuth, updateUser);

// TOGGLE status
router.patch('/:id/status', optionalAuth, toggleUserStatus);

// DELETE user (soft)
router.delete('/:id', optionalAuth, deleteUser);

module.exports = router;