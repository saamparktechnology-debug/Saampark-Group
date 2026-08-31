const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Ensure avatar_url column exists in users table
pool.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT NULL').catch(() => {});

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.department, u.status, u.permissions, u.last_login, u.created_at,
              u.company_id, u.company_ids, u.branch_id, u.avatar_url,
              r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
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
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.department, u.status, u.permissions, u.company_id, u.company_ids, u.branch_id, u.avatar_url,
              r.name as role_name, r.id as role_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
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
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, name, email, username, password, phone, role_id, status, permissions, department, company_id, company_ids, companyIds, branch_id, branchId, avatar_url, avatar, avatarUrl } = req.body;

    const displayName = full_name || name || null;
    const phoneVal = phone !== undefined ? (phone || null) : null;
    const statusVal = status || null;
    const avatarVal = avatar_url || avatar || avatarUrl || null;
    const usernameVal = username !== undefined ? (username ? username.toLowerCase().trim() : null) : undefined;
    const branchIdVal = branch_id !== undefined ? (branch_id || null) : (branchId !== undefined ? (branchId || null) : undefined);
    let roleIdVal = role_id ? parseInt(role_id, 10) : null;
    if (!roleIdVal && req.body.role) {
      const rLower = String(req.body.role).toLowerCase();
      if (rLower.includes('super')) roleIdVal = 1;
      else if (rLower.includes('admin')) roleIdVal = 2;
      else if (rLower.includes('client')) roleIdVal = 4;
      else roleIdVal = 3;
    }

    // RBAC Hierarchy Enforcement:
    // Only a Super Admin or Admin can promote/assign Super Admin (1) or Admin (2)
    if (roleIdVal === 1 || roleIdVal === 2) {
      if (req.user && req.user.role_id > 2) {
        return errorResponse(res, 403, 'Only a Super Admin or Admin can assign Super Admin or Admin roles.');
      }
    }

    const newEmailVal = email ? email.toLowerCase().trim() : null;
    const oldEmailVal = (req.body.old_email || req.body.oldEmail || '').toLowerCase().trim();
    const targetEmail = (oldEmailVal || newEmailVal || id || '').toLowerCase().trim();

    // Multi-company serialization
    const compList = company_ids || companyIds || (company_id ? [company_id] : null);
    const compIdsStr = Array.isArray(compList) ? JSON.stringify(compList) : (typeof compList === 'string' ? compList : null);

    // Build dynamic SET clause
    const setClauses = [];
    const params = [];

    if (displayName !== null) { setClauses.push('full_name = COALESCE(?, full_name)'); params.push(displayName); }
    if (newEmailVal) { setClauses.push('email = ?'); params.push(newEmailVal); }
    if (usernameVal !== undefined) { setClauses.push('username = ?'); params.push(usernameVal); }
    if (phoneVal !== null || phone === '') { setClauses.push('phone = ?'); params.push(phoneVal); }
    if (statusVal) { setClauses.push('status = ?'); params.push(statusVal); }
    if (roleIdVal) { setClauses.push('role_id = ?'); params.push(roleIdVal); }
    if (company_id) { setClauses.push('company_id = ?'); params.push(company_id); }
    if (compIdsStr) { setClauses.push('company_ids = ?'); params.push(compIdsStr); }
    if (branchIdVal !== undefined) { setClauses.push('branch_id = ?'); params.push(branchIdVal); }
    if (department !== undefined) { setClauses.push('department = ?'); params.push(department || null); }
    if (avatarVal !== null) { setClauses.push('avatar_url = ?'); params.push(avatarVal); }
    if (permissions !== undefined && permissions !== null) {
      const permStr = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
      setClauses.push('permissions = ?');
      params.push(permStr);
    }
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const { hashPassword } = require('../utils/passwordHash');
      const hashedPassword = await hashPassword(password.trim());
      setClauses.push('password_hash = ?');
      params.push(hashedPassword);
    }

    if (setClauses.length === 0) {
      return successResponse(res, 200, 'No changes to update.');
    }

    setClauses.push('updated_at = NOW()');
    const isNumericId = !isNaN(parseInt(id, 10)) && Number(id) > 0;
    
    if (isNumericId) {
      params.push(id, targetEmail, oldEmailVal || id);
      await pool.execute(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? OR email = ? OR email = ?`,
        params
      );
    } else {
      params.push(targetEmail || id, oldEmailVal || id);
      await pool.execute(
        `UPDATE users SET ${setClauses.join(', ')} WHERE email = ? OR email = ?`,
        params
      );
    }

    // Also sync updated user record & permissions into app_data JSON store
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      let currentUsers = [];
      if (appDataRows.length > 0) {
        try { currentUsers = JSON.parse(appDataRows[0].data_json) } catch {}
      }
      if (!Array.isArray(currentUsers)) currentUsers = [];

      const lookupEmail = newEmailVal || targetEmail;
      const [updatedUserRows] = await pool.execute(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? OR u.email = ? OR u.email = ?',
        [id, lookupEmail, targetEmail]
      );
      if (updatedUserRows.length > 0) {
        const u = updatedUserRows[0];
        const emailNorm = (u.email || '').toLowerCase().trim();
        let permObj = null;
        if (typeof u.permissions === 'string') {
          try { permObj = JSON.parse(u.permissions); } catch {}
        } else if (u.permissions && typeof u.permissions === 'object') {
          permObj = u.permissions;
        }

        let parsedCompanyIds = [];
        if (u.company_ids) {
          try { parsedCompanyIds = JSON.parse(u.company_ids); } catch { parsedCompanyIds = [u.company_ids]; }
        }
        if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
          parsedCompanyIds = [u.company_id || 'tech'];
        }

        const effectiveAvatar = avatarVal || u.avatar_url || undefined;

        const updatedItem = {
          id: String(u.id),
          name: u.full_name || u.email,
          email: emailNorm,
          username: u.username || (usernameVal !== undefined ? usernameVal : undefined),
          role: u.role_name || (u.role_id === 1 ? 'Super Admin' : u.role_id === 2 ? 'Admin' : u.role_id === 4 ? 'Clients' : 'Teams'),
          companyId: u.company_id || 'tech',
          companyIds: parsedCompanyIds,
          companyName: u.company_name || 'SAAMPARK Technology',
          branchId: req.body.branch_id || req.body.branchId || undefined,
          branchName: req.body.branch_name || req.body.branchName || undefined,
          avatarUrl: effectiveAvatar,
          avatar: effectiveAvatar,
          status: u.status === 'inactive' ? 'Inactive' : 'Active',
          department: u.department || 'General',
          phone: u.phone || '',
          permissions: permObj,
          allowedModules: permObj?.allowedModules,
        };

        // Filter out any ghost record with oldEmailVal or targetId
        const filteredUsers = currentUsers.filter((cu) => {
          const cuEmail = (cu.email || '').toLowerCase().trim();
          const cuId = String(cu.id || '').toLowerCase().trim();
          if (cuId && cuId === String(u.id).toLowerCase().trim()) return false;
          if (cuEmail === emailNorm) return false;
          if (oldEmailVal && cuEmail === oldEmailVal) return false;
          return true;
        });

        const newUsersList = [updatedItem, ...filteredUsers];

        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ('users', ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify(newUsersList)]
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
    const { full_name, name, email, username, password, phone, role_id, role, company_id, company_ids, companyIds, companyName, department, permissions } = req.body;
    const displayName = full_name || name;

    if (!displayName || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required.');
    }

    const normEmail = email.toLowerCase().trim();
    const normUsername = username ? username.toLowerCase().trim() : null;

    // Check existing users (including soft-deleted)
    const [existing] = await pool.execute('SELECT id, deleted_at FROM users WHERE email = ?', [normEmail]);

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

    // RBAC Hierarchy Enforcement:
    // 1. Super Admin role can ONLY be created/assigned by a Super Admin
    if (targetRoleId === 1) {
      if (req.user && req.user.role_id !== 1) {
        return errorResponse(res, 403, 'Access denied: Only an existing Super Admin can create Super Admin accounts.');
      }
    }
    // 2. Admin role can ONLY be created/assigned by a Super Admin
    if (targetRoleId === 2) {
      if (req.user && req.user.role_id !== 1) {
        return errorResponse(res, 403, 'Access denied: Only a Super Admin can create or assign Admin accounts.');
      }
    }

    const { hashPassword } = require('../utils/passwordHash');
    const hashedPassword = await hashPassword(password);

    const roleName = targetRoleId === 1 ? 'Super Admin' : targetRoleId === 2 ? 'Admin' : targetRoleId === 4 ? 'Clients' : 'Teams';
    const permStr = permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : null;

    // Multi-company handling
    const compList = company_ids || companyIds || (company_id ? [company_id] : ['tech']);
    const parsedCompList = Array.isArray(compList) ? compList : [compList];
    const compVal = parsedCompList[0] || company_id || 'tech';
    const compIdsStr = JSON.stringify(parsedCompList);

    let userId = null;

    if (existing.length > 0) {
      // Update existing or reactivate soft deleted account
      userId = existing[0].id;
      await pool.execute(
        `UPDATE users 
         SET full_name = ?, username = COALESCE(?, username), password_hash = ?, phone = ?, department = ?, company_id = ?, company_ids = ?, role_id = ?, permissions = ?, is_verified = 1, status = 'active', deleted_at = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [displayName, normUsername, hashedPassword, phone || null, department || null, compVal, compIdsStr, targetRoleId, permStr, userId]
      );
      // Remove from deleted_items tracking
      await pool.execute('DELETE FROM deleted_items WHERE item_id = ? AND module_name = "users"', [normEmail]).catch(() => {});
    } else {
      // Admin created users are marked is_verified = 1 automatically!
      const [result] = await pool.execute(
        'INSERT INTO users (role_id, full_name, email, username, password_hash, phone, department, company_id, company_ids, permissions, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
        [targetRoleId, displayName, normEmail, normUsername, hashedPassword, phone || null, department || null, compVal, compIdsStr, permStr, 'active']
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
        username: normUsername || undefined,
        role: roleName,
        companyId: compVal,
        companyIds: parsedCompList,
        companyName: companyName || (compVal === 'digital' ? 'SAAMPARK Digital Marketing' : 'SAAMPARK Technology'),
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
    const compName = companyName || (compVal === 'digital' ? 'SAAMPARK Digital Marketing' : 'SAAMPARK Technology');
    let emailSent = false;
    try {
      const { sendAdminCreatedAccountEmail } = require('../utils/emailService');
      await sendAdminCreatedAccountEmail(normEmail, displayName, roleName, compName, password, compVal);
      emailSent = true;
      console.log(`Welcome credentials email sent successfully to ${normEmail}`);
    } catch (emailErr) {
      console.warn('Welcome email warning:', emailErr.message);
    }

    return successResponse(res, 201, `User account saved successfully${emailSent ? ' and welcome credentials email sent!' : ' (email sending queued).'}`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleUserStatus, deleteUser, createUser };