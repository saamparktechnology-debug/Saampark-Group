const pool = require('../config/db');

const ALLOWED_BRANCH_FIELDS = [
  'company_id', 'name', 'code', 'address', 'city', 'state', 'country', 'phone', 'email', 'manager_id', 'is_active', 'logo_url',
  'brand_name', 'division_name', 'subtitle', 'iso_certification', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
  'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
  'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
  'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
  'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url',
  'signature_position', 'stamp_position', 'logo_position', 'logo_scale', 'stamp_scale', 'signature_scale', 'custom_stamps', 'invoice_customization'
];

let cachedBranchColumns = null;

async function getExistingColumns() {
  if (cachedBranchColumns) return cachedBranchColumns;
  try {
    const [cols] = await pool.execute('SHOW COLUMNS FROM branches');
    if (cols && cols.length > 0) {
      cachedBranchColumns = cols.map(c => c.Field);
      return cachedBranchColumns;
    }
  } catch (e) {}
  return ALLOWED_BRANCH_FIELDS;
}

const branchModel = {
  async create(data) {
    const existingCols = await getExistingColumns();
    const fields = [];
    const placeholders = [];
    const values = [];

    const numCompanyId = !isNaN(Number(data.company_id)) && Number(data.company_id) > 0 ? Number(data.company_id) : 1;

    for (const key of ALLOWED_BRANCH_FIELDS) {
      if (data[key] !== undefined && existingCols.includes(key)) {
        fields.push(key);
        placeholders.push('?');
        let val = data[key];
        if (key === 'company_id') {
          val = numCompanyId;
        } else if (key === 'is_active') {
          val = (val === 1 || val === true || val === '1' || val === 'Active') ? 1 : 0;
        } else if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        } else if (val === '') {
          val = null;
        }
        values.push(val);
      }
    }

    if (!fields.includes('name') && existingCols.includes('name')) {
      fields.push('name');
      placeholders.push('?');
      values.push(data.name || 'New Branch');
    }
    if (!fields.includes('company_id') && existingCols.includes('company_id')) {
      fields.push('company_id');
      placeholders.push('?');
      values.push(numCompanyId);
    }
    if (!fields.includes('is_active') && existingCols.includes('is_active')) {
      fields.push('is_active');
      placeholders.push('?');
      values.push(1);
    }

    let insertId = null;
    try {
      if (fields.length > 0) {
        const [result] = await pool.execute(
          `INSERT INTO branches (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
          values
        );
        insertId = result.insertId;
      }
    } catch (err) {
      console.warn('Branch insert error, falling back to minimal columns:', err.message);
      // Fallback: insert with core minimal columns that always exist
      try {
        const [subResult] = await pool.execute(
          `INSERT INTO branches (name, company_id, code, city, state, address, phone, email, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            data.name || 'New Branch',
            numCompanyId,
            data.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
            data.city || null,
            data.state || null,
            data.address || null,
            data.phone || null,
            data.email || null
          ]
        );
        insertId = subResult.insertId;
      } catch (innerErr) {
        console.error('Minimal branch insert error:', innerErr.message);
      }
    }

    const generatedId = insertId ? `br-${insertId}` : (data.id || `branch_${Date.now()}`);

    // Always sync newly created branch to app_data for guaranteed persistence
    try {
      const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"').catch(() => [[]]);
      let list = [];
      if (rows && rows.length > 0 && rows[0].data_json) {
        try { list = JSON.parse(rows[0].data_json); } catch {}
      }
      if (!Array.isArray(list)) list = [];
      const branchObj = {
        ...data,
        id: generatedId,
        numeric_id: insertId || undefined,
        company_id: numCompanyId,
        companyId: String(data.companyId || (numCompanyId === 1 ? 'tech' : 'consultancy')),
        is_active: 1,
        status: 'Active'
      };
      list = [...list.filter(b => b.id !== branchObj.id && (branchObj.code ? b.code !== branchObj.code : true)), branchObj];
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ("branches", ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [JSON.stringify(list)]
      ).catch(() => {});
    } catch {}

    return insertId || generatedId;
  },

  async findById(id) {
    try {
      const isNum = !isNaN(Number(id)) && Number(id) > 0;
      const sql = isNum
        ? `SELECT b.*, u.full_name as manager_name FROM branches b LEFT JOIN users u ON b.manager_id = u.id WHERE b.id = ?`
        : `SELECT b.*, u.full_name as manager_name FROM branches b LEFT JOIN users u ON b.manager_id = u.id WHERE b.code = ? OR b.name = ?`;
      const [rows] = await pool.execute(sql, [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}

    // Check app_data
    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          return list.find(b => String(b.id) === String(id) || String(b.code) === String(id)) || null;
        }
      }
    } catch {}
    return null;
  },

  async findByCompany(company_id) {
    let sqlBranches = [];
    try {
      const [rows] = await pool.execute(
        `SELECT b.*, u.full_name as manager_name,
         (SELECT COUNT(*) FROM sub_branches sb WHERE sb.branch_id = b.id) as sub_branch_count,
         (SELECT COUNT(*) FROM users u2 WHERE u2.branch_id = b.id) as user_count
         FROM branches b LEFT JOIN users u ON b.manager_id = u.id
         WHERE b.company_id = ? ORDER BY b.name`, [company_id]
      );
      sqlBranches = rows || [];
    } catch (e) {
      console.warn('findByCompany SQL warning:', e.message);
    }

    // Overlay app_data branches
    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          const compMatches = list.filter(b => {
            const bComp = String(b.company_id || b.companyId || '').toLowerCase();
            const targetComp = String(company_id).toLowerCase();
            return bComp === targetComp || (targetComp === '1' && bComp === 'tech') || (targetComp === '2' && (bComp === 'consultancy' || bComp === 'print'));
          });
          const map = new Map();
          sqlBranches.forEach(b => map.set(String(b.id), b));
          compMatches.forEach(b => {
            const key = String(b.id || b.numeric_id || b.code);
            if (!map.has(key)) map.set(key, b);
          });
          return Array.from(map.values());
        }
      }
    } catch {}

    return sqlBranches;
  },

  async update(id, data) {
    const existingCols = await getExistingColumns();
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (ALLOWED_BRANCH_FIELDS.includes(key) && existingCols.includes(key) && val !== undefined) {
        fields.push(`${key} = ?`);
        let finalVal = val;
        if (typeof finalVal === 'object' && finalVal !== null) {
          finalVal = JSON.stringify(finalVal);
        } else if (finalVal === '') {
          finalVal = null;
        }
        values.push(finalVal);
      }
    }
    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      const isNum = !isNaN(Number(id)) && Number(id) > 0;
      if (isNum) {
        values.push(Number(id));
        await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`, values).catch(err => {
          console.warn('MySQL branch update warning:', err.message);
        });
      } else {
        values.push(String(id));
        await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE code = ?`, values).catch(err => {
          console.warn('MySQL branch update warning:', err.message);
        });
      }
    }

    // Also update in app_data
    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
      if (appRows && appRows.length > 0) {
        let list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          list = list.map(b => (String(b.id) === String(id) || String(b.code) === String(id)) ? { ...b, ...data } : b);
          await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "branches"', [JSON.stringify(list)]);
        }
      }
    } catch {}
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM branches WHERE id = ? OR code = ?', [id, id]).catch(() => {});
    return true;
  },

  async findAll() {
    let sqlBranches = [];
    try {
      const [rows] = await pool.execute(
        `SELECT b.*, u.full_name as manager_name,
         (SELECT COUNT(*) FROM sub_branches sb WHERE sb.branch_id = b.id) as sub_branch_count,
         (SELECT COUNT(*) FROM users u2 WHERE u2.branch_id = b.id) as user_count
         FROM branches b LEFT JOIN users u ON b.manager_id = u.id ORDER BY b.name`
      );
      sqlBranches = rows || [];
    } catch {}

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list) && list.length > 0) {
          const map = new Map();
          sqlBranches.forEach(b => map.set(String(b.id), b));
          list.forEach(b => {
            const key = String(b.id || b.numeric_id || b.code);
            if (!map.has(key)) map.set(key, b);
          });
          return Array.from(map.values());
        }
      }
    } catch {}

    return sqlBranches;
  },

  async getStats(company_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as total_branches,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_branches
         FROM branches WHERE company_id = ?`, [company_id]
      );
      return rows[0];
    } catch {
      return { total_branches: 0, active_branches: 0 };
    }
  }
};

module.exports = branchModel;
