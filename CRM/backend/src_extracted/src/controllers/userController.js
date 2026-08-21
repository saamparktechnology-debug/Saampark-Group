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
    const { full_name, name, email, phone, role_id, status, permissions, department } = req.body;

    const displayName = full_name || name || null;
    const phoneVal = phone !== undefined ? (phone || null) : null;
    const statusVal = status || null;
    let roleIdVal = role_id ? parseInt(role_id, 10) : null;
    if (!roleIdVal && req.body.role) {
      const rLower = String(req.body.role).toLowerCase();
      if (rLower.includes('super admin')) roleIdVal = 1;
      else if (rLower.includes('admin')) roleIdVal = 2;
      else if (rLower.includes('client')) roleIdVal = 4;
      else roleIdVal = 3;
    }
    const targetEmail = (email || id || '').toLowerCase().trim();

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
    params.push(id, id, targetEmail);

    await pool.execute(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? OR email = ? OR email = ?`,
      params
    );

    // Also sync updated user record & permissions into app_data JSON store
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      let currentUsers = [];
      if (appDataRows.length > 0) {
        try { currentUsers = JSON.parse(appDataRows[0].data_json) } catch {}
      }
      if (!Array.isArray(currentUsers)) currentUsers = [];

      const [updatedUserRows] = await pool.execute('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? OR u.email = ? OR u.email = ?', [id, id, targetEmail]);
      if (updatedUserRows.length > 0) {
        const u = updatedUserRows[0];
        const emailNorm = (u.email || '').toLowerCase().trim();
        let permObj = null;
        if (typeof u.permissions === 'string') {
          try { permObj = JSON.parse(u.permissions); } catch {}
        } else if (u.permissions && typeof u.permissions === 'object') {
          permObj = u.permissions;
        }

        const updatedItem = {
          id: String(u.id),
          name: u.full_name || u.email,
          email: emailNorm,
          role: u.role_name || 'Teams',
          companyId: u.company_id || 'tech',
          companyName: u.company_name || 'SAAMPARK Technology',
          status: u.status === 'inactive' ? 'Inactive' : 'Active',
          department: u.department || 'General',
          phone: u.phone || '',
          permissions: permObj,
          allowedModules: permObj?.allowedModules,
        };

        const existingIdx = currentUsers.findIndex((cu) => (cu.email || '').toLowerCase().trim() === emailNorm);
        if (existingIdx >= 0) {
          currentUsers[existingIdx] = { ...currentUsers[existingIdx], ...updatedItem };
        } else {
          currentUsers.unshift(updatedItem);
        }

        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ('users', ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify(currentUsers)]
        );
      }
    } catch (appErr) {
      console.warn('App data sync on updateUser warning:', appErr.message);
    }

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

    // Fetch user details for deleted_items tracking
    const [targetUsers] = await pool.execute('SELECT id, email FROM users WHERE id = ? OR email = ?', [id, id]);
    if (targetUsers.length > 0) {
      const emailNorm = targetUsers[0].email.toLowerCase().trim();
      const idStr = String(targetUsers[0].id).toLowerCase().trim();
      await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "users")', [emailNorm]);
      await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "users")', [idStr]);
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


// ─── CREATE USER (ADMIN CREATED - BYPASSES OTP) ─────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { full_name, name, email, password, phone, role_id, role, company_id, companyName, department, permissions } = req.body;
    const displayName = full_name || name;

    if (!displayName || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required.');
    }

    const normEmail = email.toLowerCase().trim();

    // Check existing users (including soft-deleted)
    const [existing] = await pool.execute('SELECT id, deleted_at FROM users WHERE email = ?', [normEmail]);
    if (existing.length > 0 && !existing[0].deleted_at) {
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
    const permStr = permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : null;

    let userId = null;

    const compVal = company_id ? String(company_id) : 'tech';

    if (existing.length > 0 && existing[0].deleted_at) {
      // Re-activate soft deleted account
      userId = existing[0].id;
      await pool.execute(
        `UPDATE users 
         SET full_name = ?, password_hash = ?, phone = ?, department = ?, company_id = ?, role_id = ?, permissions = ?, is_verified = 1, status = 'active', deleted_at = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [displayName, hashedPassword, phone || null, department || null, compVal, targetRoleId, permStr, userId]
      );
      // Remove from deleted_items tracking
      await pool.execute('DELETE FROM deleted_items WHERE item_id = ? AND module_name = "users"', [normEmail]);
    } else {
      // Admin created users are marked is_verified = 1 automatically!
      const [result] = await pool.execute(
        'INSERT INTO users (role_id, full_name, email, password_hash, phone, department, company_id, permissions, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
        [targetRoleId, displayName, normEmail, hashedPassword, phone || null, department || null, compVal, permStr, 'active']
      );
      userId = result.insertId;
    }

    // Sync newly created user to app_data JSON store for real-time cross-browser hydration
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      let currentUsers = [];
      if (appDataRows.length > 0) {
        try { currentUsers = JSON.parse(appDataRows[0].data_json) } catch {}
      }
      if (!Array.isArray(currentUsers)) currentUsers = [];

      const newUserItem = {
        id: String(userId),
        name: displayName,
        email: normEmail,
        role: roleName,
        companyId: company_id || 'tech',
        companyName: companyName || (company_id === 'digital' ? 'SAAMPARK Digital Marketing' : 'SAAMPARK Technology'),
        status: 'Active',
        department: department || 'General',
        phone: phone || '',
        password: password || 'Password123',
        lastLogin: 'Just created',
        joinedDate: new Date().toISOString().split('T')[0],
        permissions: permissions || null,
        allowedModules: permissions?.allowedModules,
      };

      const existingIdx = currentUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === normEmail);
      if (existingIdx >= 0) {
        currentUsers[existingIdx] = { ...currentUsers[existingIdx], ...newUserItem };
      } else {
        currentUsers.unshift(newUserItem);
      }

      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ('users', ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [JSON.stringify(currentUsers)]
      );
    } catch (appDataErr) {
      console.warn('App data sync warning:', appDataErr.message);
    }

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
      id: userId,
      full_name: displayName,
      email: normEmail,
      role_name: roleName,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser, createUser };