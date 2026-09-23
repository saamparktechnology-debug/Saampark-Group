const pool = require('../config/db');

const departmentModel = {
  async create({ company_id, branch_id, name, code, description, head_id }) {
    const [result] = await pool.execute(
      `INSERT INTO departments (company_id, branch_id, name, code, description, head_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [company_id, branch_id || null, name, code || null, description || null, head_id || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT d.*, u.full_name as head_name,
       (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = d.id) as member_count
       FROM departments d LEFT JOIN users u ON d.head_id = u.id WHERE d.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT d.*, u.full_name as head_name,
       (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = d.id) as member_count
       FROM departments d LEFT JOIN users u ON d.head_id = u.id
       WHERE d.company_id = ? ORDER BY d.name`, [company_id]
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
    await pool.execute(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
    return true;
  }
};

module.exports = departmentModel;
