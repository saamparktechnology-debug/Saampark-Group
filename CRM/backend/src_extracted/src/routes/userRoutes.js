const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// GET all users
router.get('/', authenticate, getAllUsers);

// GET single user
router.get('/:id', authenticate, getUserById);

// UPDATE user — Admin/Super Admin only
router.put('/:id', authenticate, requireRole(1, 2), updateUser);

// TOGGLE status — Admin/Super Admin only
router.patch('/:id/status', authenticate, requireRole(1, 2), toggleUserStatus);

// DELETE user (soft) — Admin/Super Admin only
router.delete('/:id', authenticate, requireRole(1, 2), deleteUser);

module.exports = router;