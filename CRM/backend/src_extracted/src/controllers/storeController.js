const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get module data stored in MySQL database (with strict company_id isolation)
const getStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const companyId = req.query.company_id || req.query.companyId;

    // 1. If companyId provided (and not 'all')
    if (companyId && companyId !== 'all') {
      const compKey = `${key}_${companyId}`;
      const [compRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [compKey]);
      if (compRows.length > 0) {
        try {
          const parsedComp = JSON.parse(compRows[0].data_json);
          return successResponse(res, 200, 'Company-isolated module data fetched from MySQL', parsedComp);
        } catch {}
      }

      // Initial migration fallback for default primary company 'tech'
      if (companyId === 'tech') {
        const [defaultRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
        if (defaultRows.length > 0) {
          try {
            const parsed = JSON.parse(defaultRows[0].data_json);
            return successResponse(res, 200, 'Primary company initial data fetched', parsed);
          } catch {}
        }
      }

      // For any other company without records, return empty array [] (BLANK!)
      return successResponse(res, 200, 'Company module data is empty / blank', []);
    }

    // 2. Query default / global module key (when companyId is 'all' or omitted)
    const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
    
    if (rows.length === 0) {
      return successResponse(res, 200, 'No data found for module', []);
    }
    
    let parsed = [];
    try {
      parsed = JSON.parse(rows[0].data_json);
    } catch {}

    return successResponse(res, 200, 'Module data fetched from MySQL', parsed);
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
