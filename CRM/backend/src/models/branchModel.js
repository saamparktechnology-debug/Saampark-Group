const pool = require('../config/db');

const ALLOWED_BRANCH_FIELDS = [
  'company_id', 'name', 'code', 'address', 'city', 'state', 'country', 'phone', 'email', 'manager_id', 'is_active',
  'brand_name', 'division_name', 'subtitle', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
  'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
  'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
  'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
  'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url'
];

const branchModel = {
  async create(data) {
    const fields = [];
    const placeholders = [];
    const values = [];

    for (const key of ALLOWED_BRANCH_FIELDS) {
      if (data[key] !== undefined) {
        fields.push(key);
        placeholders.push('?');
        values.push(data[key] === '' ? null : data[key]);
      }
    }

    if (!fields.includes('name')) {
      fields.push('name');
      placeholders.push('?');
      values.push(data.name || 'New Branch');
    }
    if (!fields.includes('company_id')) {
      fields.push('company_id');
      placeholders.push('?');
      values.push(data.company_id || 1);
    }

    const [result] = await pool.execute(
      `INSERT INTO branches (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
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
      if (ALLOWED_BRANCH_FIELDS.includes(key) && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val === '' ? null : val);
      }
    }
    if (fields.length === 0) return false;
    fields.push('updated_at = NOW()');
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

