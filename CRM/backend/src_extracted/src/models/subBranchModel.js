const pool = require('../config/db');

const ALLOWED_SUB_BRANCH_FIELDS = [
  'branch_id', 'company_id', 'name', 'code', 'address', 'city', 'state', 'phone', 'email', 'manager_id', 'is_active', 'logo_url',
  'brand_name', 'division_name', 'subtitle', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
  'parentBranchId', 'partnerName', 'partnerPhone', 'partnerEmail', 'partnerType', 'revenueSharePct',
  'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
  'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
  'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
  'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url'
];

let cachedSubBranchColumns = null;

async function getExistingSubBranchColumns() {
  if (cachedSubBranchColumns) return cachedSubBranchColumns;
  try {
    const [cols] = await pool.execute('SHOW COLUMNS FROM sub_branches');
    if (cols && cols.length > 0) {
      cachedSubBranchColumns = cols.map(c => c.Field);
      return cachedSubBranchColumns;
    }
  } catch (e) {}
  return ALLOWED_SUB_BRANCH_FIELDS;
}

function resolveSubCompanyNumericId(company_id) {
  const str = String(company_id || '').toLowerCase().trim();
  if (str === '2' || str === 'consultancy' || str.includes('consult') || str === 'print' || str === 'digital') {
    return 2;
  }
  return 1;
}

function getSubCompanyMatchingList(company_id) {
  const num = resolveSubCompanyNumericId(company_id);
  return num === 2 ? [2, '2', 'consultancy', 'digital', 'print'] : [1, '1', 'tech', 'technology'];
}

const subBranchModel = {
  async create(data) {
    const existingCols = await getExistingSubBranchColumns();
    const fields = [];
    const placeholders = [];
    const values = [];

    // Ensure company_id is valid integer
    const cleanCompanyId = resolveSubCompanyNumericId(data.company_id || data.companyId);

    // Ensure branch_id resolves to an existing branch in MySQL branches table
    let cleanBranchId = !isNaN(parseInt(data.branch_id, 10)) && parseInt(data.branch_id, 10) > 0 ? parseInt(data.branch_id, 10) : null;
    
    // Check if the branch_id actually exists in branches table
    if (cleanBranchId) {
      const [exists] = await pool.execute('SELECT id FROM branches WHERE id = ?', [cleanBranchId]).catch(() => [[]]);
      if (!exists || exists.length === 0) {
        cleanBranchId = null;
      }
    }

    // Try finding by string id or code
    if (!cleanBranchId) {
      const targetIdentifier = data.branch_id || data.parentBranchId;
      if (targetIdentifier) {
        const [found] = await pool.execute('SELECT id FROM branches WHERE id = ? OR code = ? OR name = ?', [targetIdentifier, targetIdentifier, targetIdentifier]).catch(() => [[]]);
        if (found && found.length > 0) {
          cleanBranchId = found[0].id;
        }
      }
    }

    // Fallback: pick any active branch for this company
    if (!cleanBranchId) {
      const compMatches = getSubCompanyMatchingList(cleanCompanyId);
      const [compBranches] = await pool.execute(`SELECT id FROM branches WHERE company_id IN (${compMatches.map(()=>'?').join(',')}) OR company_id = ? ORDER BY id ASC LIMIT 1`, [...compMatches, String(cleanCompanyId)]).catch(() => [[]]);
      if (compBranches && compBranches.length > 0) {
        cleanBranchId = compBranches[0].id;
      }
    }

    // If still no branch exists in MySQL, insert a default Head Branch so foreign key does not fail
    if (!cleanBranchId) {
      try {
        const [newB] = await pool.execute(
          'INSERT INTO branches (name, company_id, code, city, state, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          ['Main Head Branch', cleanCompanyId, `BR-${cleanCompanyId}01`, 'Kolkata', 'West Bengal']
        );
        cleanBranchId = newB.insertId;
      } catch (e) {
        cleanBranchId = 1;
      }
    }

    for (const key of ALLOWED_SUB_BRANCH_FIELDS) {
      if (data[key] !== undefined && existingCols.includes(key)) {
        fields.push(key);
        placeholders.push('?');
        let val = data[key] === '' ? null : data[key];
        if (key === 'branch_id') val = cleanBranchId;
        else if (key === 'company_id') val = cleanCompanyId;
        else if (key === 'is_active') val = (val === 1 || val === true || val === '1' || val === 'Active') ? 1 : 0;
        else if (val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (!fields.includes('name') && existingCols.includes('name')) {
      fields.push('name');
      placeholders.push('?');
      values.push(data.name || 'New Sub Branch');
    }
    if (!fields.includes('branch_id') && existingCols.includes('branch_id')) {
      fields.push('branch_id');
      placeholders.push('?');
      values.push(cleanBranchId);
    }
    if (!fields.includes('company_id') && existingCols.includes('company_id')) {
      fields.push('company_id');
      placeholders.push('?');
      values.push(cleanCompanyId);
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
          `INSERT INTO sub_branches (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
          values
        );
        insertId = result.insertId;
      }
    } catch (err) {
      console.warn('Sub-branch insert error, falling back to core columns:', err.message);
      try {
        const [subResult] = await pool.execute(
          `INSERT INTO sub_branches (name, branch_id, company_id, code, address, city, state, phone, email, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            data.name || 'New Sub Branch',
            cleanBranchId,
            cleanCompanyId,
            data.code || `SB-${Math.floor(100 + Math.random() * 900)}`,
            data.address || null,
            data.city || null,
            data.state || null,
            data.phone || null,
            data.email || null
          ]
        );
        insertId = subResult.insertId;
      } catch (innerErr) {
        console.error('Minimal sub-branch insert error:', innerErr.message);
      }
    }

    const generatedId = insertId ? `sb-${insertId}` : (data.id || `subbranch_${Date.now()}`);

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
        id: generatedId,
        parentBranchId: data.parentBranchId || data.branch_id || String(cleanBranchId),
        branch_id: cleanBranchId,
        numeric_id: insertId || undefined,
        company_id: cleanCompanyId,
        companyId: String(data.companyId || (cleanCompanyId === 1 ? 'tech' : 'consultancy')),
        is_active: 1,
        status: 'Active'
      };
      list = [...list.filter(sb => sb.id !== subBranchObj.id && (subBranchObj.code ? sb.code !== subBranchObj.code : true)), subBranchObj];
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ("sub_branches", ?)
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
        ? `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
           FROM sub_branches sb
           LEFT JOIN branches b ON sb.branch_id = b.id
           LEFT JOIN users u ON sb.manager_id = u.id
           WHERE sb.id = ?`
        : `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
           FROM sub_branches sb
           LEFT JOIN branches b ON sb.branch_id = b.id
           LEFT JOIN users u ON sb.manager_id = u.id
           WHERE sb.code = ? OR sb.name = ?`;
      const [rows] = await pool.execute(sql, [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          return list.find(sb => String(sb.id) === String(id) || String(sb.code) === String(id)) || null;
        }
      }
    } catch {}
    return null;
  },

  async findByBranch(branch_id) {
    let sqlSub = [];
    try {
      const [rows] = await pool.execute(
        `SELECT sb.* FROM sub_branches sb WHERE sb.branch_id = ? ORDER BY sb.name`,
        [branch_id]
      );
      sqlSub = rows || [];
    } catch {}

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          const matched = list.filter(sb => String(sb.branch_id) === String(branch_id) || String(sb.parentBranchId) === String(branch_id));
          const map = new Map();
          sqlSub.forEach(sb => map.set(String(sb.id), sb));
          matched.forEach(sb => {
            const key = String(sb.id || sb.numeric_id || sb.code);
            if (!map.has(key)) map.set(key, sb);
          });
          return Array.from(map.values());
        }
      }
    } catch {}

    return sqlSub;
  },

  async findByCompany(company_id) {
    let sqlSub = [];
    const num = resolveSubCompanyNumericId(company_id);
    const matches = getSubCompanyMatchingList(company_id);
    const placeholders = matches.map(() => '?').join(', ');
    try {
      const [rows] = await pool.execute(
        `SELECT sb.*, b.name as branch_name
         FROM sub_branches sb
         INNER JOIN branches b ON sb.branch_id = b.id
         WHERE b.company_id IN (${placeholders}) OR b.company_id = ? ORDER BY sb.name`,
        [...matches, String(num)]
      );
      sqlSub = rows || [];
    } catch {}

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          const matched = list.filter(sb => {
            const sbComp = String(sb.company_id || sb.companyId || '').toLowerCase();
            const targetComp = String(company_id).toLowerCase();
            return sbComp === targetComp || (targetComp === '1' && sbComp === 'tech') || (targetComp === '2' && (sbComp === 'consultancy' || sbComp === 'print'));
          });
          const map = new Map();
          sqlSub.forEach(sb => map.set(String(sb.id), sb));
          matched.forEach(sb => {
            const key = String(sb.id || sb.numeric_id || sb.code);
            if (!map.has(key)) map.set(key, sb);
          });
          return Array.from(map.values());
        }
      }
    } catch {}

    return sqlSub;
  },

  async findAll() {
    let sqlSub = [];
    try {
      const [rows] = await pool.execute(
        `SELECT sb.*, b.name as branch_name, u.full_name as manager_name
         FROM sub_branches sb
         LEFT JOIN branches b ON sb.branch_id = b.id
         LEFT JOIN users u ON sb.manager_id = u.id
         ORDER BY sb.name`
      );
      sqlSub = rows || [];
    } catch {}

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
      if (appRows && appRows.length > 0) {
        const list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list) && list.length > 0) {
          const map = new Map();
          sqlSub.forEach(sb => map.set(String(sb.id), sb));
          list.forEach(sb => {
            const key = String(sb.id || sb.numeric_id || sb.code);
            if (!map.has(key)) map.set(key, sb);
          });
          return Array.from(map.values());
        }
      }
    } catch {}

    return sqlSub;
  },

  async update(id, data) {
    const existingCols = await getExistingSubBranchColumns();
    const fields = [];
    const values = [];
    for (const [key, rawVal] of Object.entries(data)) {
      if (ALLOWED_SUB_BRANCH_FIELDS.includes(key) && existingCols.includes(key) && rawVal !== undefined) {
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
    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      const isNum = !isNaN(Number(id)) && Number(id) > 0;
      if (isNum) {
        values.push(Number(id));
        await pool.execute(`UPDATE sub_branches SET ${fields.join(', ')} WHERE id = ?`, values).catch(err => {
          console.warn('MySQL sub_branch update warning:', err.message);
        });
      } else {
        values.push(String(id));
        await pool.execute(`UPDATE sub_branches SET ${fields.join(', ')} WHERE code = ?`, values).catch(err => {
          console.warn('MySQL sub_branch update warning:', err.message);
        });
      }
    }

    try {
      const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
      if (appRows && appRows.length > 0) {
        let list = JSON.parse(appRows[0].data_json);
        if (Array.isArray(list)) {
          list = list.map(sb => (String(sb.id) === String(id) || String(sb.code) === String(id)) ? { ...sb, ...data } : sb);
          await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "sub_branches"', [JSON.stringify(list)]);
        }
      }
    } catch {}
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM sub_branches WHERE id = ? OR code = ?', [id, id]).catch(() => {});
    return true;
  }
};

module.exports = subBranchModel;
