const pool = require('../config/db');

const ALLOWED_SUB_BRANCH_FIELDS = [
  'branch_id', 'company_id', 'name', 'code', 'address', 'city', 'state', 'phone', 'email', 'manager_id', 'is_active',
  'brand_name', 'division_name', 'subtitle', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
  'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
  'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
  'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
  'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url'
];

const subBranchModel = {
  async create(data) {
    const fields = [];
    const placeholders = [];
    const values = [];

    for (const key of ALLOWED_SUB_BRANCH_FIELDS) {
      if (data[key] !== undefined) {
        fields.push(key);
        placeholders.push('?');
        values.push(data[key] === '' ? null : data[key]);
      }
    }

    if (!fields.includes('name')) {
      fields.push('name');
      placeholders.push('?');
      values.push(data.name || 'New Sub Branch');
    }
    if (!fields.includes('branch_id')) {
      fields.push('branch_id');
      placeholders.push('?');
      values.push(data.branch_id || data.parentBranchId || 1);
    }
    if (!fields.includes('company_id')) {
      fields.push('company_id');
      placeholders.push('?');
      values.push(data.company_id || 1);
    }

    const [result] = await pool.execute(
      `INSERT INTO sub_branches (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
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
      if (ALLOWED_SUB_BRANCH_FIELDS.includes(key) && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val === '' ? null : val);
      }
    }
    if (fields.length === 0) return false;
    fields.push('updated_at = NOW()');
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

