const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get all deleted item IDs across all modules (with optional module filtering)
const getDeletedItems = async (req, res, next) => {
  try {
    const { moduleName } = req.query;
    let query = 'SELECT item_id, module_name FROM deleted_items';
    const params = [];
    if (moduleName && moduleName !== 'all') {
      query += ' WHERE module_name = ?';
      params.push(moduleName);
    }
    const [rows] = await pool.execute(query, params);
    return successResponse(res, 200, 'Deleted items fetched successfully', rows);
  } catch (err) {
    next(err);
  }
};

// Mark an item as deleted globally in MySQL
const markItemDeleted = async (req, res, next) => {
  try {
    const { id, moduleName } = req.body;
    if (!id) return errorResponse(res, 400, 'Item ID is required');

    // Block Clients from deleting system items
    if (req.user && (req.user.role_id === 4 || String(req.user.role_name || req.user.role || '').toLowerCase().includes('client'))) {
      return errorResponse(res, 403, 'Permission Denied: Clients cannot delete system records');
    }

    const strId = String(id).toLowerCase().trim();
    const mod = String(moduleName || 'global').toLowerCase().trim();
    await pool.execute(
      'INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, ?)',
      [strId, mod]
    );

    // Also actively purge this item from app_data rows
    if (mod && mod !== 'global') {
      try {
        const [appRows] = await pool.execute(
          'SELECT id, module_key, data_json FROM app_data WHERE module_key = ? OR module_key LIKE ?',
          [mod, `${mod}_%`]
        );
        for (const row of appRows) {
          try {
            const parsed = JSON.parse(row.data_json);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(item => {
                if (!item) return false;
                const itemIdStr = item.id !== undefined && item.id !== null ? String(item.id).toLowerCase().trim() : '';
                const itemEmailStr = item.email ? String(item.email).toLowerCase().trim() : '';
                return itemIdStr !== strId && itemEmailStr !== strId;
              });
              if (cleaned.length !== parsed.length) {
                await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(cleaned), row.id]);
              }
            }
          } catch {}
        }
      } catch (purgeErr) {
        console.warn('app_data purge warning on delete:', purgeErr);
      }
    }

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
