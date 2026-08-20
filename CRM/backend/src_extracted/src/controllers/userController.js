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

// ─── CREATE USER (ADMIN CREATED - BYPASSES OTP) ─────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { full_name, name, email, password, phone, role_id, role, company_id, companyName, department } = req.body;
    const displayName = full_name || name;

    if (!displayName || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required.');
    }

    const normEmail = email.toLowerCase().trim();

    // Check existing
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [normEmail]);
    if (existing.length > 0) {
      return errorResponse(res, 400, 'An account with this email address already exists.');
    }

    const { hashPassword } = require('../utils/passwordHash');
    const hashedPassword = await hashPassword(password);

    // Map role string to ID if needed
    let targetRoleId = 3;
    if (role_id) {
      targetRoleId = parseInt(role_id, 10);
    } else if (role) {
      const rLower = role.toLowerCase();
      if (rLower.includes('super')) targetRoleId = 1;
      else if (rLower.includes('admin')) targetRoleId = 2;
      else if (rLower.includes('client')) targetRoleId = 4;
      else targetRoleId = 3;
    }

    const roleName = targetRoleId === 1 ? 'Super Admin' : targetRoleId === 2 ? 'Admin' : targetRoleId === 4 ? 'Clients' : 'Teams';

    // Admin created users are marked is_verified = 1 automatically!
    const [result] = await pool.execute(
      'INSERT INTO users (role_id, full_name, email, password_hash, phone, department, company_id, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [targetRoleId, displayName, normEmail, hashedPassword, phone || null, department || null, company_id || null, 'active']
    );

    // Send Welcome Email with credentials and change password instructions
    const compName = companyName || (company_id === 'digital' ? 'SAAMPARK Digital Marketing' : 'SAAMPARK Technology');
    try {
      const { sendAdminCreatedAccountEmail } = require('../utils/emailService');
      await sendAdminCreatedAccountEmail(normEmail, displayName, roleName, compName, password);
      console.log(`Welcome credentials email sent to ${normEmail}`);
    } catch (emailErr) {
      console.warn('Welcome email warning:', emailErr.message);
    }

    return successResponse(res, 201, 'User account created successfully and welcome credentials email sent!', {
      id: result.insertId,
      full_name: displayName,
      email: normEmail,
      role_name: roleName,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser, createUser };