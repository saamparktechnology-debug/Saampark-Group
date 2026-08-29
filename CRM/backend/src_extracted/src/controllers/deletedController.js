const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get all deleted item IDs across all modules
const getDeletedItems = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT item_id FROM deleted_items');
    const ids = rows.map((r) => r.item_id);
    return successResponse(res, 200, 'Deleted items fetched successfully', ids);
  } catch (err) {
    next(err);
  }
};

// Mark an item as deleted globally in MySQL
const markItemDeleted = async (req, res, next) => {
  try {
    const { id, moduleName } = req.body;
    if (!id) return errorResponse(res, 400, 'Item ID is required');

    const strId = String(id).toLowerCase().trim();
    await pool.execute(
      'INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, ?)',
      [strId, moduleName || 'global']
    );
    return successResponse(res, 200, 'Item marked deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Unmark / restore an item from deleted_items table
const unmarkItemDeleted = async (req, res, next) => {
  try {
    const rawId = req.params.id || req.body.id;
    if (!rawId) return errorResponse(res, 400, 'Item ID is required');

    const strId = String(rawId).toLowerCase().trim();
    await pool.execute('DELETE FROM deleted_items WHERE LOWER(TRIM(item_id)) = ?', [strId]);
    return successResponse(res, 200, 'Item restored / unmarked from deleted items successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDeletedItems, markItemDeleted, unmarkItemDeleted };
