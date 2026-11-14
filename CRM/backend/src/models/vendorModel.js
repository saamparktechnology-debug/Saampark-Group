const pool = require('../config/db');

const vendorModel = {
  async create(data) {
    const fields = ['company_id', 'name', 'contact_person', 'email', 'phone', 'address', 'city', 'state', 'country', 'gst_number', 'pan_number', 'bank_name', 'bank_account', 'ifsc_code', 'category', 'payment_terms', 'rating', 'notes', 'branch_id'];
    const values = fields.map(f => data[f] !== undefined ? data[f] : null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO vendors (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM vendors WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id, { search, status, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM vendors WHERE company_id = ?';
    const params = [company_id];

    if (search) {
      query += ' AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const offset = (page - 1) * limit;
    query += ` ORDER BY name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params);

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM vendors WHERE company_id = ?', [company_id]
    );

    return { data: rows, total: countResult[0].total, page, limit };
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
    await pool.execute(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM vendors WHERE id = ?', [id]);
    return true;
  },

  async getStats(company_id) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active
       FROM vendors WHERE company_id = ?`, [company_id]
    );
    return rows[0];
  }
};

module.exports = vendorModel;
