const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Ensure avatar_url column exists in users table
pool.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT NULL').catch(() => {});
pool.execute('ALTER TABLE users ADD COLUMN sub_branch_id INT NULL').catch(() => {});

// Helper: Resolve requesting user info from JWT or headers
async function resolveRequester(req) {
  if (req.user && req.user.role_id) return req.user;
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, role_id, company_id, company_ids, branch_id, sub_branch_id FROM users WHERE (id = ? OR email = ?) AND deleted_at IS NULL',
        [headerUserId, headerUserId]
      );
      if (rows.length > 0) return rows[0];
    } catch {}
  }
  const headerRole = req.headers['x-user-role'];
  if (headerRole === 'Super Admin') return { role_id: 1 };
  if (headerRole === 'Admin') return { role_id: 2 };
  if (headerRole === 'Clients') return { role_id: 4 };
  return { role_id: 3 }; // default Teams
}

// Helper: Check if target company is in requester's assigned company scope
function isCompanyInScope(creator, targetComp) {
  if (!creator || creator.role_id === 1) return true; // Super Admin can access any company
  const targetNorm = String(targetComp || '').toLowerCase().trim();
  let allowed = [];
  if (creator.company_ids) {
    try {
      const parsed = typeof creator.company_ids === 'string' ? JSON.parse(creator.company_ids) : creator.company_ids;
      if (Array.isArray(parsed)) allowed = parsed.map(c => String(c).toLowerCase().trim());
    } catch {}
  }
  if (creator.company_id) {
    allowed.push(String(creator.company_id).toLowerCase().trim());
  }
  return allowed.includes(targetNorm);
}

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const requester = await resolveRequester(req);
    const companyId = req.companySlug || req.companyId || req.headers['x-company-id'] || req.query.company_id || req.query.companyId;
    const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.query.branchId;
    const subBranchId = req.headers['x-sub-branch-id'] || req.query.sub_branch_id || req.query.subBranchId;

    let query = `
      SELECT u.id, u.full_name, u.email, u.username, u.phone, u.department, u.status, u.permissions, u.last_login, u.created_at,
             u.company_id, u.company_ids, u.branch_id, u.sub_branch_id, u.avatar_url,
             r.name as role_name, r.id as role_id,
             b.name as branch_name, sb.name as sub_branch_name, c.name as company_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN sub_branches sb ON u.sub_branch_id = sb.id
      LEFT JOIN companies c ON (u.company_id = c.id OR u.company_id = c.slug)
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    // Role-based scoping
    if (requester.role_id === 1) {
      // Super Admin:
      // Can switch between companies and branches
      if (companyId && companyId !== 'all') {
        query += ` AND (u.company_id = ? OR u.company_id = ? OR JSON_CONTAINS(COALESCE(u.company_ids, '[]'), JSON_QUOTE(?)) OR JSON_CONTAINS(COALESCE(u.company_ids, '[]'), JSON_QUOTE(?)))`;
        params.push(String(req.companyId || companyId), String(req.companySlug || companyId), String(req.companyId || companyId), String(req.companySlug || companyId));
      }
      if (branchId && branchId !== 'all') {
        query += ` AND u.branch_id = ?`;
        params.push(branchId);
      }
      if (subBranchId && subBranchId !== 'all') {
        query += ` AND u.sub_branch_id = ?`;
        params.push(subBranchId);
      }
    } else if (requester.role_id === 2 && requester.branch_id) {
      // Branch Admin: locked strictly to their assigned branch!
      query += ` AND u.branch_id = ?`;
      params.push(requester.branch_id);
      if (subBranchId && subBranchId !== 'all') {
        query += ` AND u.sub_branch_id = ?`;
        params.push(subBranchId);
      }
    } else if (requester.role_id === 2) {
      // Company Admin (no specific branch assigned):
      let compList = [];
      if (requester.company_ids) {
        try {
          const parsed = typeof requester.company_ids === 'string' ? JSON.parse(requester.company_ids) : requester.company_ids;
          if (Array.isArray(parsed)) compList = parsed;
        } catch {}
      }
      if (requester.company_id && !compList.includes(requester.company_id)) {
        compList.push(requester.company_id);
      }
      if (compList.length === 0) compList = ['tech'];

      const targetComp = (companyId && companyId !== 'all') ? companyId : null;
      if (targetComp) {
        query += ` AND (u.company_id = ? OR u.company_id = ? OR JSON_CONTAINS(COALESCE(u.company_ids, '[]'), JSON_QUOTE(?)) OR JSON_CONTAINS(COALESCE(u.company_ids, '[]'), JSON_QUOTE(?)))`;
        params.push(String(req.companyId || targetComp), String(req.companySlug || targetComp), String(req.companyId || targetComp), String(req.companySlug || targetComp));
      } else {
        const compPlaceholders = compList.map(() => '?').join(', ');
        query += ` AND (u.company_id IN (${compPlaceholders}))`;
        params.push(...compList.map(String));
      }

      if (branchId && branchId !== 'all') {
        query += ` AND u.branch_id = ?`;
        params.push(branchId);
      }
      if (subBranchId && subBranchId !== 'all') {
        query += ` AND u.sub_branch_id = ?`;
        params.push(subBranchId);
      }
    } else {
      // Teams / Clients
      const effectiveBranch = requester.branch_id || branchId;
      if (effectiveBranch && effectiveBranch !== 'all') {
        query += ` AND u.branch_id = ?`;
        params.push(effectiveBranch);
      } else if (companyId && companyId !== 'all') {
        query += ` AND (u.company_id = ? OR u.company_id = ?)`;
        params.push(String(req.companyId || companyId), String(req.companySlug || companyId));
      }
    }

    query += ` ORDER BY u.id DESC`;
    const [users] = await pool.execute(query, params);
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
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.department, u.status, u.permissions, u.company_id, u.company_ids, u.branch_id, u.sub_branch_id, u.avatar_url,
              r.name as role_name, r.id as role_id,
              b.name as branch_name, sb.name as sub_branch_name, c.name as company_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       LEFT JOIN sub_branches sb ON u.sub_branch_id = sb.id
       LEFT JOIN companies c ON (u.company_id = c.id OR u.company_id = c.slug)
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
    const { 
      full_name, name, email, username, password, phone, role_id, status, 
      permissions, department, company_id, company_ids, companyIds, 
      branch_id, branchId, sub_branch_id, subBranchId,
      avatar_url, avatar, avatarUrl 
    } = req.body;

    const requester = await resolveRequester(req);

    const displayName = full_name || name || null;
    const phoneVal = phone !== undefined ? (phone || null) : null;
    const statusVal = status || null;
    const avatarVal = avatar_url || avatar || avatarUrl || null;
    const usernameVal = username !== undefined ? (username ? username.toLowerCase().trim() : null) : undefined;
    const branchIdVal = branch_id !== undefined ? (branch_id || null) : (branchId !== undefined ? (branchId || null) : undefined);
    const subBranchIdVal = sub_branch_id !== undefined ? (sub_branch_id || null) : (subBranchId !== undefined ? (subBranchId || null) : undefined);
    
    let roleIdVal = role_id ? parseInt(role_id, 10) : null;
    if (!roleIdVal && req.body.role) {
      const rLower = String(req.body.role).toLowerCase();
      if (rLower.includes('super')) roleIdVal = 1;
      else if (rLower.includes('admin')) roleIdVal = 2;
      else if (rLower.includes('client')) roleIdVal = 4;
      else roleIdVal = 3;
    }

    // RBAC Hierarchy Enforcement:
    // Only a Super Admin can promote/assign Super Admin (1) or Admin (2)
    if (roleIdVal === 1 || roleIdVal === 2) {
      if (requester.role_id !== 1) {
        return errorResponse(res, 403, 'Only a Super Admin can assign Super Admin or Admin roles.');
      }
    }

    // Company Scoping for Admin:
    if (requester.role_id === 2 && company_id) {
      if (!isCompanyInScope(requester, company_id)) {
        return errorResponse(res, 403, 'Access denied: Admins cannot assign users outside their assigned company.');
      }
    }

    // Branch Scoping for Branch Admin:
    if (requester.role_id === 2 && requester.branch_id && branchIdVal !== undefined) {
      if (branchIdVal && String(branchIdVal) !== String(requester.branch_id)) {
        return errorResponse(res, 403, 'Access denied: Branch Admins can only assign users to their assigned branch.');
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
    if (subBranchIdVal !== undefined) { setClauses.push('sub_branch_id = ?'); params.push(subBranchIdVal); }
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
          branchId: u.branch_id || req.body.branch_id || req.body.branchId || undefined,
          branchName: req.body.branch_name || req.body.branchName || undefined,
          subBranchId: u.sub_branch_id || req.body.sub_branch_id || req.body.subBranchId || undefined,
          subBranchName: req.body.sub_branch_name || req.body.subBranchName || undefined,
          avatarUrl: effectiveAvatar,
          avatar: effectiveAvatar,
          status: u.status === 'inactive' ? 'Inactive' : 'Active',
          department: u.department || 'General',
          phone: u.phone || '',
          permissions: permObj,
          allowedModules: permObj?.allowedModules,
        };

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

// ─── CREATE USER (ADMIN / SUPER ADMIN CREATED) ─────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { 
      full_name, name, email, username, password, phone, 
      role_id, role, company_id, company_ids, companyIds, companyName, 
      branch_id, branchId, sub_branch_id, subBranchId,
      department, permissions 
    } = req.body;
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

    const requester = await resolveRequester(req);

    // RBAC Hierarchy Enforcement:
    // Super Admin (1) and Admin (2) can ONLY be created by a Super Admin (1)
    if (targetRoleId === 1 || targetRoleId === 2) {
      if (requester.role_id !== 1) {
        return errorResponse(res, 403, 'Access denied: Only a Super Admin can create or assign Admin accounts.');
      }
    }

    // Company Scoping for Admin:
    // Admin can ONLY create teams/clients in their assigned company
    const targetComp = company_id || (company_ids && company_ids[0]) || (companyIds && companyIds[0]) || 'tech';
    if (requester.role_id === 2) {
      if (!isCompanyInScope(requester, targetComp)) {
        return errorResponse(res, 403, 'Access denied: Admins can only add users to their assigned company.');
      }
    }

    // Branch Scoping for Branch Admin:
    // If Admin is a Branch Admin, user must be assigned to that branch
    let effectiveBranchId = branch_id || branchId || null;
    let effectiveSubBranchId = sub_branch_id || subBranchId || null;
    if (requester.role_id === 2 && requester.branch_id) {
      if (effectiveBranchId && String(effectiveBranchId) !== String(requester.branch_id)) {
        return errorResponse(res, 403, 'Access denied: Branch Admins can only assign users to their assigned branch.');
      }
      effectiveBranchId = requester.branch_id;
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
         SET full_name = ?, username = COALESCE(?, username), password_hash = ?, phone = ?, department = ?, 
             company_id = ?, company_ids = ?, branch_id = ?, sub_branch_id = ?, role_id = ?, permissions = ?, 
             is_verified = 1, status = 'active', deleted_at = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [displayName, normUsername, hashedPassword, phone || null, department || null, 
         compVal, compIdsStr, effectiveBranchId || null, effectiveSubBranchId || null, targetRoleId, permStr, userId]
      );
      // Remove from deleted_items tracking
      await pool.execute('DELETE FROM deleted_items WHERE item_id = ? AND module_name = "users"', [normEmail]).catch(() => {});
    } else {
      const [result] = await pool.execute(
        `INSERT INTO users 
         (role_id, full_name, email, username, password_hash, phone, department, company_id, company_ids, branch_id, sub_branch_id, permissions, is_verified, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [targetRoleId, displayName, normEmail, normUsername, hashedPassword, phone || null, department || null, 
         compVal, compIdsStr, effectiveBranchId || null, effectiveSubBranchId || null, permStr, 'active']
      );
      userId = result.insertId;
    }

    // Resolve branch and sub-branch names
    let branchName = undefined;
    let subBranchName = undefined;
    if (effectiveBranchId) {
      try {
        const [bRows] = await pool.execute('SELECT name FROM branches WHERE id = ?', [effectiveBranchId]);
        if (bRows.length > 0) branchName = bRows[0].name;
      } catch {}
    }
    if (effectiveSubBranchId) {
      try {
        const [sbRows] = await pool.execute('SELECT name FROM sub_branches WHERE id = ?', [effectiveSubBranchId]);
        if (sbRows.length > 0) subBranchName = sbRows[0].name;
      } catch {}
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
        branchId: effectiveBranchId || undefined,
        branchName: branchName || undefined,
        subBranchId: effectiveSubBranchId || undefined,
        subBranchName: subBranchName || undefined,
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
