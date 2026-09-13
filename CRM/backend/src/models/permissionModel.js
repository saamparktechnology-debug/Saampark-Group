const pool = require('../config/db');

const permissionModel = {
  async getAll() {
    const [rows] = await pool.execute('SELECT * FROM permissions ORDER BY module, action');
    return rows;
  },

  async getByModule(module) {
    const [rows] = await pool.execute('SELECT * FROM permissions WHERE module = ?', [module]);
    return rows;
  },

  async getRolePermissions(role_id) {
    const [rows] = await pool.execute(
      `SELECT p.*, rp.granted FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? ORDER BY p.module, p.action`, [role_id]
    );
    return rows;
  },

  async getUserPermissions(user_id) {
    const [rows] = await pool.execute(
      `SELECT p.*, up.granted FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.user_id = ? ORDER BY p.module, p.action`, [user_id]
    );
    return rows;
  },

  async setRolePermissions(role_id, permissionIds, granted = true) {
    await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [role_id]);
    for (const pid of permissionIds) {
      await pool.execute(
        'INSERT INTO role_permissions (role_id, permission_id, granted) VALUES (?, ?, ?)',
        [role_id, pid, granted ? 1 : 0]
      );
    }
  },

  async setUserPermissions(user_id, permissionIds, granted = true) {
    await pool.execute('DELETE FROM user_permissions WHERE user_id = ?', [user_id]);
    for (const pid of permissionIds) {
      await pool.execute(
        'INSERT INTO user_permissions (user_id, permission_id, granted) VALUES (?, ?, ?)',
        [user_id, pid, granted ? 1 : 0]
      );
    }
  },

  async checkPermission(userId, role_id, module, action) {
    const [userPerm] = await pool.execute(
      `SELECT granted FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.user_id = ? AND p.module = ? AND p.action = ?`, [userId, module, action]
    );
    if (userPerm.length > 0) return userPerm[0].granted === 1;

    const [rolePerm] = await pool.execute(
      `SELECT granted FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.module = ? AND p.action = ?`, [role_id, module, action]
    );
    if (rolePerm.length > 0) return rolePerm[0].granted === 1;

    if (role_id === 1) return true;
    return false;
  },

  async getModules() {
    const [rows] = await pool.execute('SELECT DISTINCT module FROM permissions ORDER BY module');
    return rows.map(r => r.module);
  },

  async createCustomRole({ company_id, name, description, parent_role_id }) {
    const [result] = await pool.execute(
      `INSERT INTO custom_roles (company_id, name, description, parent_role_id) VALUES (?, ?, ?, ?)`,
      [company_id, name, description || null, parent_role_id || null]
    );
    return result.insertId;
  },

  async getCustomRoles(company_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM custom_roles WHERE company_id = ? ORDER BY name', [company_id]
    );
    return rows;
  },

  async updateCustomRole(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE custom_roles SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async deleteCustomRole(id) {
    await pool.execute('DELETE FROM custom_roles WHERE id = ?', [id]);
    return true;
  }
};

module.exports = permissionModel;
