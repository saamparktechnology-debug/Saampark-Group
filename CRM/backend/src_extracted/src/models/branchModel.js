const pool = require('../config/db');

const branchModel = {
  async create({ company_id, name, code, address, city, state, country, phone, email, manager_id }) {
    const [result] = await pool.execute(
      `INSERT INTO branches (company_id, name, code, address, city, state, country, phone, email, manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id, name, code || null, address || null, city || null, state || null, country || 'India', phone || null, email || null, manager_id || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT b.*, u.full_name as manager_name FROM branches b
       LEFT JOIN users u ON b.manager_id = u.id WHERE b.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT b.*, u.full_name as manager_name,
       (SELECT COUNT(*) FROM sub_branches sb WHERE sb.branch_id = b.id) as sub_branch_count,
       (SELECT COUNT(*) FROM users u2 WHERE u2.branch_id = b.id) as user_count
       FROM branches b LEFT JOIN users u ON b.manager_id = u.id
       WHERE b.company_id = ? ORDER BY b.name`, [company_id]
    );
    return rows;
  },

  async update(id, data) {
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
    await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM branches WHERE id = ?', [id]);
    return true;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT b.*, u.full_name as manager_name,
       (SELECT COUNT(*) FROM sub_branches sb WHERE sb.branch_id = b.id) as sub_branch_count,
       (SELECT COUNT(*) FROM users u2 WHERE u2.branch_id = b.id) as user_count
       FROM branches b LEFT JOIN users u ON b.manager_id = u.id ORDER BY b.name`
    );
    return rows;
  },

  async getStats(company_id) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as total_branches,
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_branches
       FROM branches WHERE company_id = ?`, [company_id]
    );
    return rows[0];
  }
};

module.exports = branchModel;

