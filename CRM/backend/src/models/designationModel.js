const pool = require('../config/db');

const designationModel = {
  async create({ company_id, name, level, description }) {
    const [result] = await pool.execute(
      `INSERT INTO designations (company_id, name, level, description) VALUES (?, ?, ?, ?)`,
      [company_id, name, level || 0, description || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM designations WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM designations WHERE company_id = ? ORDER BY level, name', [company_id]
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
    await pool.execute(`UPDATE designations SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM designations WHERE id = ?', [id]);
    return true;
  }
};

module.exports = designationModel;
