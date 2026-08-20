const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser, createUser } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// GET all users
router.get('/', authenticate, getAllUsers);

// CREATE user (Admin/Super Admin) — Bypasses OTP, sends welcome credentials email
router.post('/', authenticate, requireRole(1, 2), createUser);

// GET single user
router.get('/:id', authenticate, getUserById);

// UPDATE user — Admin/Super Admin only
router.put('/:id', authenticate, requireRole(1, 2), updateUser);

// TOGGLE status — Admin/Super Admin only
router.patch('/:id/status', authenticate, requireRole(1, 2), toggleUserStatus);

// DELETE user (soft) — Admin/Super Admin only
router.delete('/:id', authenticate, requireRole(1, 2), deleteUser);

module.exports = router;