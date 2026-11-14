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

async function ensureBranchColumns() {
  try {
    const colsToEnsure = [
      'is_active TINYINT(1) DEFAULT 1',
      'status VARCHAR(50) DEFAULT "active"',
      'brand_name VARCHAR(191) NULL',
      'division_name VARCHAR(191) NULL',
      'subtitle VARCHAR(255) NULL',
      'logo_url LONGTEXT NULL',
      'signatory_name VARCHAR(191) NULL',
      'signatory_designation VARCHAR(191) NULL',
      'signature_image_url LONGTEXT NULL',
      'stamp_image_url LONGTEXT NULL',
      'gstin VARCHAR(64) NULL',
      'pan VARCHAR(64) NULL',
      'cin VARCHAR(64) NULL',
      'msme_reg VARCHAR(64) NULL',
      'website VARCHAR(191) NULL',
      'upi_id VARCHAR(191) NULL',
      'account_holder VARCHAR(191) NULL',
      'bank_name VARCHAR(191) NULL',
      'account_number VARCHAR(191) NULL',
      'ifsc_code VARCHAR(64) NULL',
      'bank_branch VARCHAR(191) NULL',
      'payment_qr_url LONGTEXT NULL',
      'gst_bank_name VARCHAR(191) NULL',
      'gst_account_holder VARCHAR(191) NULL',
      'gst_account_number VARCHAR(191) NULL',
      'gst_ifsc_code VARCHAR(64) NULL',
      'gst_bank_branch VARCHAR(191) NULL',
      'gst_upi_id VARCHAR(191) NULL',
      'gst_payment_qr_url LONGTEXT NULL',
      'nongst_bank_name VARCHAR(191) NULL',
      'nongst_account_holder VARCHAR(191) NULL',
      'nongst_account_number VARCHAR(191) NULL',
      'nongst_ifsc_code VARCHAR(64) NULL',
      'nongst_bank_branch VARCHAR(191) NULL',
      'nongst_upi_id VARCHAR(191) NULL',
      'nongst_payment_qr_url LONGTEXT NULL',
      'terms_conditions LONGTEXT NULL',
      'invoice_notes LONGTEXT NULL',
      'quotation_notes LONGTEXT NULL',
      'signature_position JSON NULL',
      'stamp_position JSON NULL',
      'logo_position JSON NULL',
      'logo_scale DECIMAL(5,2) NULL',
      'stamp_scale DECIMAL(5,2) NULL',
      'signature_scale DECIMAL(5,2) NULL',
      'custom_stamps JSON NULL',
      'preview_invoice_type VARCHAR(50) NULL',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    ];

    for (const def of colsToEnsure) {
      await pool.execute(`ALTER TABLE branches ADD COLUMN ${def}`).catch(async () => {
        await pool.execute(`ALTER TABLE branches MODIFY COLUMN ${def}`).catch(() => {});
      });
    }
    cachedBranchColumns = null;
  } catch {}
}
ensureBranchColumns();

async function getExistingColumns() {
  try {
    const [cols] = await pool.execute('SHOW COLUMNS FROM branches');
    if (cols && cols.length > 0) {
      cachedBranchColumns = cols.map(c => c.Field);
      return cachedBranchColumns;
    }
  } catch (e) {}
  return ALLOWED_BRANCH_FIELDS;
}

function resolveCompanyNumericId(company_id) {
  const str = String(company_id || '').toLowerCase().trim();
  if (str === '2' || str === 'consultancy' || str.includes('consult') || str === 'print' || str === 'digital') {
    return 2;
  }
  return 1;
}

function getCompanyMatchingList(company_id) {
  const num = resolveCompanyNumericId(company_id);
  return num === 2 ? [2, '2', 'consultancy', 'digital', 'print'] : [1, '1', 'tech', 'technology'];
}

const branchModel = {
  async create(data) {
    const existingCols = await getExistingColumns();
    const fields = [];
    const placeholders = [];
    const values = [];

    const numCompanyId = resolveCompanyNumericId(data.company_id || data.companyId);

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

    const generatedId = data.id || ('br_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    if (!fields.includes('id') && existingCols.includes('id')) {
      fields.push('id');
      placeholders.push('?');
      values.push(generatedId);
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
    if (!fields.includes('status') && existingCols.includes('status')) {
      fields.push('status');
      placeholders.push('?');
      values.push('active');
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
        const fallbackCols = ['name', 'company_id', 'code'];
        const fallbackVals = [
          data.name || 'New Branch',
          numCompanyId,
          data.code || `BR-${Math.floor(100 + Math.random() * 900)}`
        ];
        if (existingCols.includes('city') && data.city) { fallbackCols.push('city'); fallbackVals.push(data.city); }
        if (existingCols.includes('state') && data.state) { fallbackCols.push('state'); fallbackVals.push(data.state); }
        if (existingCols.includes('address') && data.address) { fallbackCols.push('address'); fallbackVals.push(data.address); }
        if (existingCols.includes('phone') && data.phone) { fallbackCols.push('phone'); fallbackVals.push(data.phone); }
        if (existingCols.includes('email') && data.email) { fallbackCols.push('email'); fallbackVals.push(data.email); }
        if (existingCols.includes('is_active')) { fallbackCols.push('is_active'); fallbackVals.push(1); }
        else if (existingCols.includes('status')) { fallbackCols.push('status'); fallbackVals.push('active'); }

        const [subResult] = await pool.execute(
          `INSERT INTO branches (${fallbackCols.join(', ')}) VALUES (${fallbackCols.map(() => '?').join(', ')})`,
          fallbackVals
        );
        insertId = subResult.insertId;
      } catch (innerErr) {
        console.error('Minimal branch insert error:', innerErr.message);
      }
    }

    const finalReturnId = insertId ? `br-${insertId}` : generatedId;

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
        id: finalReturnId,
        numeric_id: insertId || undefined,
        company_id: numCompanyId,
        companyId: String(data.companyId || (numCompanyId === 1 ? 'tech' : 'consultancy')),
        is_active: 1,
        status: 'Active'
      };
      list = [...list.filter(b => String(b.id) !== String(branchObj.id) && (branchObj.code ? String(b.code) !== String(branchObj.code) : true)), branchObj];
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ("branches", ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [JSON.stringify(list)]
      ).catch(() => {});

      // If company 2 (consultancy), also sync to branches_2 and branches_consultancy
      if (numCompanyId === 2) {
        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ("branches_consultancy", ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify(list.filter(b => resolveCompanyNumericId(b.company_id || b.companyId) === 2))]
        ).catch(() => {});
        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ("branches_2", ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify(list.filter(b => resolveCompanyNumericId(b.company_id || b.companyId) === 2))]
        ).catch(() => {});
      }
    } catch {}

    return insertId || finalReturnId;
  },

  async findById(id) {
    try {
      const isNum = !isNaN(Number(id)) && Number(id) > 0;
      const sql = isNum
        ? `SELECT b.*, u.full_name as manager_name FROM branches b LEFT JOIN users u ON b.manager_id = u.id WHERE b.id = ? OR b.code = ?`
        : `SELECT b.*, u.full_name as manager_name FROM branches b LEFT JOIN users u ON b.manager_id = u.id WHERE b.id = ? OR b.code = ? OR b.name = ?`;
      const [rows] = await pool.execute(sql, isNum ? [id, String(id)] : [id, id, id]);
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
    const num = resolveCompanyNumericId(company_id);
    const matches = getCompanyMatchingList(company_id);
    const placeholders = matches.map(() => '?').join(', ');
    try {
      const [rows] = await pool.execute(
        `SELECT b.*,
         (SELECT COUNT(*) FROM sub_branches sb WHERE sb.branch_id = b.id) as sub_branch_count
         FROM branches b
         WHERE b.company_id IN (${placeholders}) OR b.company_id = ? ORDER BY b.name`,
        [...matches, String(num)]
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
      if (existingCols.includes('updated_at')) {
        fields.push('updated_at = NOW()');
      }
      const isNum = !isNaN(Number(id)) && Number(id) > 0;
      if (isNum) {
        values.push(Number(id), String(id));
        await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE id = ? OR code = ?`, values).catch(err => {
          console.warn('MySQL branch update warning:', err.message);
        });
      } else {
        values.push(String(id), String(id));
        await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE id = ? OR code = ?`, values).catch(err => {
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
    const strId = String(id);
    await pool.execute('DELETE FROM branches WHERE id = ? OR code = ?', [strId, strId]).catch(() => {});
    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
      if (appRows && appRows.length > 0) {
        let list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          const filtered = list.filter(b => String(b.id) !== strId && String(b.code) !== strId);
          await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "branches"', [JSON.stringify(filtered)]);
        }
      }
    } catch {}
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
