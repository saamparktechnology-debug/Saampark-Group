const { successResponse, errorResponse } = require('../utils/apiResponse');
const permissionModel = require('../models/permissionModel');

const permissionController = {
  async getAllPermissions(req, res) {
    try {
      const permissions = await permissionModel.getAll();
      return successResponse(res, 200, 'Permissions fetched', permissions);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getModules(req, res) {
    try {
      const modules = await permissionModel.getModules();
      return successResponse(res, 200, 'Modules fetched', modules);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getRolePermissions(req, res) {
    try {
      const permissions = await permissionModel.getRolePermissions(req.params.roleId);
      return successResponse(res, 200, 'Role permissions fetched', permissions);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async setRolePermissions(req, res) {
    try {
      const { permissionIds, granted } = req.body;
      await permissionModel.setRolePermissions(req.params.roleId, permissionIds, granted);
      return successResponse(res, 200, 'Role permissions updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getUserPermissions(req, res) {
    try {
      const permissions = await permissionModel.getUserPermissions(req.params.userId);
      return successResponse(res, 200, 'User permissions fetched', permissions);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async setUserPermissions(req, res) {
    try {
      const { permissionIds, granted } = req.body;
      await permissionModel.setUserPermissions(req.params.userId, permissionIds, granted);
      return successResponse(res, 200, 'User permissions updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async checkPermission(req, res) {
    try {
      const { module, action } = req.query;
      const granted = await permissionModel.checkPermission(req.user.id, req.user.role_id, module, action);
      return successResponse(res, 200, 'Permission check', { granted });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async createCustomRole(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await permissionModel.createCustomRole({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Custom role created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getCustomRoles(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const roles = await permissionModel.getCustomRoles(companyId);
      return successResponse(res, 200, 'Custom roles fetched', roles);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async updateCustomRole(req, res) {
    try {
      await permissionModel.updateCustomRole(req.params.id, req.body);
      return successResponse(res, 200, 'Custom role updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async deleteCustomRole(req, res) {
    try {
      await permissionModel.deleteCustomRole(req.params.id);
      return successResponse(res, 200, 'Custom role deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};


// ─── Matrix-format Permission Endpoints ──────────────────────────────────────
const matrixController = {
  async getRoleMatrix(req, res) {
    try {
      const pool = require('../config/db');
      const roleId = req.params.roleId;
      const key = `role_permissions_matrix_${String(roleId).toLowerCase().replace(/\s+/g, '_')}`;
      const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
      if (rows.length > 0) {
        const parsed = JSON.parse(rows[0].data_json);
        return res.json({ status: 'success', data: parsed });
      }
      return res.json({ status: 'success', data: null });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async saveRoleMatrix(req, res) {
    try {
      const pool = require('../config/db');
      const roleId = req.params.roleId;
      const { matrix } = req.body;
      if (!matrix || typeof matrix !== 'object') {
        return res.status(400).json({ status: 'error', message: 'matrix object required' });
      }
      const key = `role_permissions_matrix_${String(roleId).toLowerCase().replace(/\s+/g, '_')}`;
      const dataJson = JSON.stringify(matrix);
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [key, dataJson]
      );

      // Map role to numeric role_id
      let numRoleId = null;
      const rLower = String(roleId).toLowerCase().trim();
      if (rLower === '1' || rLower.includes('super')) numRoleId = 1;
      else if (rLower === '2' || rLower.includes('admin')) numRoleId = 2;
      else if (rLower === '3' || rLower.includes('team')) numRoleId = 3;
      else if (rLower === '4' || rLower.includes('client')) numRoleId = 4;

      if (numRoleId) {
        // Sync into role_permissions table
        const [allPerms] = await pool.execute('SELECT id, module, action FROM permissions');
        const permMap = new Map();
        for (const p of allPerms) {
          permMap.set(`${p.module.toLowerCase()}::${p.action.toLowerCase()}`, p.id);
        }

        const grantedPermIds = [];
        for (const [mod, actions] of Object.entries(matrix)) {
          if (actions && typeof actions === 'object') {
            for (const [act, val] of Object.entries(actions)) {
              if (val) {
                const pid = permMap.get(`${mod.toLowerCase()}::${act.toLowerCase()}`);
                if (pid) grantedPermIds.push(pid);
              }
            }
          }
        }

        if (grantedPermIds.length > 0) {
          await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [numRoleId]);
          // Batch insert
          const values = grantedPermIds.map(id => `(${numRoleId}, ${id}, 1)`).join(',');
          await pool.execute(`INSERT IGNORE INTO role_permissions (role_id, permission_id, granted) VALUES ${values}`);
        }
      }

      return res.json({ status: 'success', message: 'Role matrix saved and synced to database' });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async getUserMatrix(req, res) {
    try {
      const pool = require('../config/db');
      const userId = req.params.userId;
      const key = `user_permissions_matrix_${String(userId).toLowerCase().replace(/\s+|@/g, '_')}`;
      const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
      if (rows.length > 0) {
        const parsed = JSON.parse(rows[0].data_json);
        return res.json({ status: 'success', data: parsed });
      }
      return res.json({ status: 'success', data: null });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async saveUserMatrix(req, res) {
    try {
      const pool = require('../config/db');
      const userId = req.params.userId;
      const { matrix } = req.body;
      if (!matrix || typeof matrix !== 'object') {
        return res.status(400).json({ status: 'error', message: 'matrix object required' });
      }
      const key = `user_permissions_matrix_${String(userId).toLowerCase().replace(/\s+|@/g, '_')}`;
      const dataJson = JSON.stringify(matrix);
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [key, dataJson]
      );

      // Find numeric user id
      const [users] = await pool.execute('SELECT id FROM users WHERE id = ? OR email = ?', [userId, userId]);
      if (users.length > 0) {
        const numericUserId = users[0].id;
        const [allPerms] = await pool.execute('SELECT id, module, action FROM permissions');
        const permMap = new Map();
        for (const p of allPerms) {
          permMap.set(`${p.module.toLowerCase()}::${p.action.toLowerCase()}`, p.id);
        }

        const grantedPermIds = [];
        for (const [mod, actions] of Object.entries(matrix)) {
          if (actions && typeof actions === 'object') {
            for (const [act, val] of Object.entries(actions)) {
              if (val) {
                const pid = permMap.get(`${mod.toLowerCase()}::${act.toLowerCase()}`);
                if (pid) grantedPermIds.push(pid);
              }
            }
          }
        }

        if (grantedPermIds.length > 0) {
          await pool.execute('DELETE FROM user_permissions WHERE user_id = ?', [numericUserId]);
          const values = grantedPermIds.map(id => `(${numericUserId}, ${id}, 1)`).join(',');
          await pool.execute(`INSERT IGNORE INTO user_permissions (user_id, permission_id, granted) VALUES ${values}`);
        }
      }

      return res.json({ status: 'success', message: 'User matrix saved and synced to database' });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async getAllRoleMatrices(req, res) {
    try {
      const pool = require('../config/db');
      const [rows] = await pool.execute(
        "SELECT module_key, data_json FROM app_data WHERE module_key LIKE 'role_permissions_matrix_%'"
      );
      const result = {};
      for (const row of rows) {
        const rolePart = row.module_key.replace('role_permissions_matrix_', '');
        const roleName = rolePart === 'super_admin' ? 'Super Admin'
          : rolePart.charAt(0).toUpperCase() + rolePart.slice(1);
        try { result[roleName] = JSON.parse(row.data_json); } catch {}
      }
      return res.json({ status: 'success', data: result });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = { permissionController, matrixController };
