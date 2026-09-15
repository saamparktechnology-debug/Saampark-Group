const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper: Fetch deleted set for a module key
async function getDeletedItemIds(moduleKey) {
  try {
    const [rows] = await pool.execute(
      'SELECT LOWER(TRIM(item_id)) as item_id FROM deleted_items WHERE module_name = ? OR module_name = "global"',
      [moduleKey.toLowerCase().trim()]
    );
    return new Set(rows.map(r => r.item_id));
  } catch {
    return new Set();
  }
}

// Get module data stored in MySQL database (with seamless company isolation & full fallback)
const getStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const companyId = req.query.company_id || req.query.companyId;
    const deletedSet = await getDeletedItemIds(key);

    // 1. If companyId provided (and not 'all')
    if (companyId && companyId !== 'all') {
      const compKey = `${key}_${companyId}`;
      const [compRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [compKey]);
      if (compRows.length > 0) {
        try {
          const parsedComp = JSON.parse(compRows[0].data_json);
          if (Array.isArray(parsedComp)) {
            const filtered = parsedComp.filter(item => {
              if (!item) return false;
              const idStr = item.id !== undefined && item.id !== null ? String(item.id).toLowerCase().trim() : '';
              const emailStr = item.email ? String(item.email).toLowerCase().trim() : '';
              if (idStr && deletedSet.has(idStr)) return false;
              if (emailStr && deletedSet.has(emailStr)) return false;
              return true;
            });
            return successResponse(res, 200, 'Company-isolated module data fetched from MySQL', filtered);
          }
          return successResponse(res, 200, 'Company-isolated module data fetched from MySQL', parsedComp);
        } catch {
          return successResponse(res, 200, 'Company module data fetched', []);
        }
      }

      // Strict company isolation: If this company does not have a record yet, return empty list.
      // NEVER leak or fall back to tech or other companies!
      return successResponse(res, 200, 'Company module data fetched', []);
    }

    // 2. Query all matching module keys when companyId is 'all' or omitted
    const [rows] = await pool.execute(
      'SELECT module_key, data_json FROM app_data WHERE module_key = ? OR module_key LIKE ?',
      [key, `${key}_%`]
    );
    
    if (rows.length === 0) {
      return successResponse(res, 200, 'No data found for module', []);
    }
    
    const itemsMap = new Map();
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.data_json);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id !== undefined && item.id !== null) {
              const idStr = String(item.id).toLowerCase().trim();
              const emailStr = item.email ? String(item.email).toLowerCase().trim() : '';
              if (deletedSet.has(idStr) || (emailStr && deletedSet.has(emailStr))) {
                continue;
              }
              itemsMap.set(idStr, item);
            }
          }
        } else if (parsed && typeof parsed === 'object' && itemsMap.size === 0) {
          return successResponse(res, 200, 'Module data fetched from MySQL', parsed);
        }
      } catch {}
    }

    const mergedList = Array.from(itemsMap.values());
    return successResponse(res, 200, 'Module data fetched from MySQL', mergedList);
  } catch (err) {
    next(err);
  }
};

// Save or update module data persistently in MySQL database
const saveStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { data, company_id, companyId } = req.body;
    const targetCompanyId = company_id || companyId || req.query.company_id || req.query.companyId;

    if (data === undefined) {
      return errorResponse(res, 400, 'Data object is required.');
    }

    const dataJson = JSON.stringify(data);

    // Save strictly to company key if targetCompanyId is specified
    if (targetCompanyId && targetCompanyId !== 'all') {
      const compKey = `${key}_${targetCompanyId}`;
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [compKey, dataJson]
      );
    } else {
      // Save to global key
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [key, dataJson]
      );
    }

    return successResponse(res, 200, 'Module data saved to MySQL database successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStoreData, saveStoreData };
