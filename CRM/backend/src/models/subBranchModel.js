const pool = require('../config/db');

const subBranchModel = {
  async create({ branch_id, company_id, name, code, address, city, state, phone, email, manager_id }) {
    const [result] = await pool.execute(
      `INSERT INTO sub_branches (branch_id, company_id, name, code, address, city, state, phone, email, manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [branch_id, company_id, name, code || null, address || null, city || null, state || null, phone || null, email || null, manager_id || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
       FROM sub_branches sb
       LEFT JOIN branches b ON sb.branch_id = b.id
       LEFT JOIN users u ON sb.manager_id = u.id
       WHERE sb.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByBranch(branch_id) {
    const [rows] = await pool.execute(
      `SELECT sb.*, u.full_name as manager_name,
       (SELECT COUNT(*) FROM users u2 WHERE u2.sub_branch_id = sb.id) as user_count
       FROM sub_branches sb LEFT JOIN users u ON sb.manager_id = u.id
       WHERE sb.branch_id = ? ORDER BY sb.name`, [branch_id]
    );
    return rows;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
       FROM sub_branches sb
       LEFT JOIN branches b ON sb.branch_id = b.id
       LEFT JOIN users u ON sb.manager_id = u.id
       WHERE sb.company_id = ? ORDER BY sb.name`, [company_id]
    );
    return rows;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
       FROM sub_branches sb
       LEFT JOIN branches b ON sb.branch_id = b.id
       LEFT JOIN users u ON sb.manager_id = u.id
       ORDER BY sb.name`
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
    await pool.execute(`UPDATE sub_branches SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM sub_branches WHERE id = ?', [id]);
    return true;
  }
};

module.exports = subBranchModel;

