const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get module data stored in MySQL database
const getStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
    
    if (rows.length === 0) {
      return successResponse(res, 200, 'No data found for module', null);
    }
    
    const parsed = JSON.parse(rows[0].data_json);
    return successResponse(res, 200, 'Module data fetched from MySQL', parsed);
  } catch (err) {
    next(err);
  }
};

// Save or update module data persistently in MySQL database
const saveStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { data } = req.body;

    if (data === undefined) {
      return errorResponse(res, 400, 'Data object is required.');
    }

    const dataJson = JSON.stringify(data);

    await pool.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [key, dataJson]
    );

    return successResponse(res, 200, 'Module data saved to MySQL database successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStoreData, saveStoreData };
