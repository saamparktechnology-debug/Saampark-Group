const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.permissions, u.last_login, u.created_at,
              r.name as role_name, r.id as role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL
       ORDER BY u.id DESC`
    );
    return successResponse(res, 200, 'Users fetched successfully', users);
  } catch (error) {
    next(error);
  }
};

// ─── GET USER BY ID ───────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.permissions, r.name as role_name, r.id as role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE (u.id = ? OR u.email = ?) AND u.deleted_at IS NULL`,
      [id, id]
    );

    if (users.length === 0) {
      return errorResponse(res, 404, 'User not found.');
    }

    return successResponse(res, 200, 'User details fetched', users[0]);
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE USER ──────────────────────────────────────────────────────────────
// FIX C-1, C-2: Now correctly updates role_id in DB
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, name, phone, role_id, status, permissions, department } = req.body;

    const displayName = full_name || name || null;
    const phoneVal = phone !== undefined ? (phone || null) : null;
    const statusVal = status || null;
    const roleIdVal = role_id ? parseInt(role_id, 10) : null;

    // Build dynamic SET clause
    const setClauses = [];
    const params = [];

    if (displayName !== null) { setClauses.push('full_name = COALESCE(?, full_name)'); params.push(displayName); }
    if (phoneVal !== null || phone === '') { setClauses.push('phone = ?'); params.push(phoneVal); }
    if (statusVal) { setClauses.push('status = ?'); params.push(statusVal); }
    if (roleIdVal) { setClauses.push('role_id = ?'); params.push(roleIdVal); }
    if (department !== undefined) { setClauses.push('department = ?'); params.push(department || null); }
    if (permissions !== undefined && permissions !== null) {
      const permStr = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
      setClauses.push('permissions = ?');
      params.push(permStr);
    }

    if (setClauses.length === 0) {
      return successResponse(res, 200, 'No changes to update.');
    }

    setClauses.push('updated_at = NOW()');
    params.push(id, id);

    await pool.execute(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? OR email = ?`,
      params
    );

    return successResponse(res, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE USER STATUS ────────────────────────────────────────────────────────
// FIX C-6: Backend status toggle
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute('SELECT status FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!users.length) return errorResponse(res, 404, 'User not found.');

    const newStatus = users[0].status === 'active' ? 'inactive' : 'active';
    await pool.execute('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    return successResponse(res, 200, `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, { status: newStatus });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE USER (SOFT DELETE) ─────────────────────────────────────────────────
// FIX C-3: Soft delete — marks deleted_at instead of hard DELETE
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting Super Admin
    const [users] = await pool.execute('SELECT role_id FROM users WHERE id = ?', [id]);
    if (users.length > 0 && users[0].role_id === 1) {
      return errorResponse(res, 403, 'Super Admin accounts cannot be deleted.');
    }

    // Soft delete: set deleted_at and deactivate
    await pool.execute(
      'UPDATE users SET deleted_at = NOW(), status = ? WHERE id = ? OR email = ?',
      ['inactive', id, id]
    );

    return successResponse(res, 200, 'User removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser };