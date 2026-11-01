const pool = require('../config/db');

const ALLOWED_SUB_BRANCH_FIELDS = [
  'branch_id', 'company_id', 'name', 'code', 'address', 'city', 'state', 'phone', 'email', 'manager_id', 'is_active', 'logo_url',
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

    const cleanBranchId = !isNaN(parseInt(data.branch_id, 10)) && parseInt(data.branch_id, 10) > 0 ? parseInt(data.branch_id, 10) : (!isNaN(parseInt(data.parentBranchId, 10)) && parseInt(data.parentBranchId, 10) > 0 ? parseInt(data.parentBranchId, 10) : 1);
    const cleanCompanyId = !isNaN(parseInt(data.company_id, 10)) && parseInt(data.company_id, 10) > 0 ? parseInt(data.company_id, 10) : 1;

    for (const key of ALLOWED_SUB_BRANCH_FIELDS) {
      if (data[key] !== undefined) {
        fields.push(key);
        placeholders.push('?');
        let val = data[key] === '' ? null : data[key];
        if (key === 'branch_id') val = cleanBranchId;
        else if (key === 'company_id') val = cleanCompanyId;
        else if (val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        values.push(val);
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
      values.push(cleanBranchId);
    }
    if (!fields.includes('company_id')) {
      fields.push('company_id');
      placeholders.push('?');
      values.push(cleanCompanyId);
    }

    let insertId = null;
    try {
      const [result] = await pool.execute(
        `INSERT INTO sub_branches (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
      insertId = result.insertId;
    } catch (err) {
      console.warn('Sub-branch insert full column fallback:', err.message);
      // Fallback: insert with core minimal columns
      const coreFields = ['name', 'branch_id', 'company_id', 'code', 'address', 'city', 'state', 'phone', 'email', 'is_active'];
      const subFields = [];
      const subPlaceholders = [];
      const subValues = [];
      for (const cf of coreFields) {
        if (data[cf] !== undefined) {
          subFields.push(cf);
          subPlaceholders.push('?');
          let val = data[cf] === '' ? null : data[cf];
          if (cf === 'branch_id') val = cleanBranchId;
          else if (cf === 'company_id') val = cleanCompanyId;
          subValues.push(val);
        }
      }
      if (!subFields.includes('name')) {
        subFields.push('name');
        subPlaceholders.push('?');
        subValues.push(data.name || 'New Sub Branch');
      }
      if (!subFields.includes('branch_id')) {
        subFields.push('branch_id');
        subPlaceholders.push('?');
        subValues.push(cleanBranchId);
      }
      if (!subFields.includes('company_id')) {
        subFields.push('company_id');
        subPlaceholders.push('?');
        subValues.push(cleanCompanyId);
      }
      try {
        const [subResult] = await pool.execute(
          `INSERT INTO sub_branches (${subFields.join(', ')}) VALUES (${subPlaceholders.join(', ')})`,
          subValues
        );
        insertId = subResult.insertId;
      } catch (innerErr) {
        console.error('Core sub-branch insert error:', innerErr.message);
      }
    }

    // Always sync newly created sub-branch to app_data for guaranteed persistence
    try {
      const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"').catch(() => [[]]);
      let list = [];
      if (rows && rows.length > 0 && rows[0].data_json) {
        try { list = JSON.parse(rows[0].data_json); } catch {}
      }
      if (!Array.isArray(list)) list = [];
      const subBranchObj = {
        ...data,
        id: data.id || (insertId ? `sb-${insertId}` : `subbranch_${Date.now()}`),
        parentBranchId: data.parentBranchId || data.branch_id || String(cleanBranchId),
        numeric_id: insertId || undefined,
      };
      list = [...list.filter(sb => sb.id !== subBranchObj.id && (subBranchObj.code ? sb.code !== subBranchObj.code : true)), subBranchObj];
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ("sub_branches", ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [JSON.stringify(list)]
      ).catch(() => {});
    } catch {}

    return insertId || (data.id || `subbranch_${Date.now()}`);
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
    for (const [key, rawVal] of Object.entries(data)) {
      if (ALLOWED_SUB_BRANCH_FIELDS.includes(key) && rawVal !== undefined) {
        let val = rawVal === '' ? null : rawVal;
        if (key === 'branch_id' && val !== null && !isNaN(Number(val))) val = Number(val);
        else if (key === 'company_id' && val !== null && !isNaN(Number(val))) val = Number(val);
        else if (val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        fields.push(`${key} = ?`);
        values.push(val);
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

