const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper: Fetch deleted set for a module key
async function getDeletedItemIds(targetPool, moduleKey) {
  try {
    const [rows] = await targetPool.execute(
      'SELECT LOWER(TRIM(item_id)) as item_id FROM deleted_items WHERE module_name = ? OR module_name = "global"',
      [moduleKey.toLowerCase().trim()]
    );
    return new Set(rows.map(r => r.item_id));
  } catch {
    return new Set();
  }
}

// Get module data stored in MySQL database with multi-database routing
const getStoreData = async (req, res, next) => {
  try {
    const { key } = req.params;
    const companyId = req.query.company_id || req.query.companyId;
    let activePool = pool;
    try {
      if (pool.getCompanyPool) activePool = pool.getCompanyPool(companyId);
    } catch {
      activePool = pool;
    }
    const deletedSet = await getDeletedItemIds(activePool, key);

    // 1. If companyId provided (and not 'all')
    if (companyId && companyId !== 'all') {
      const compStr = String(companyId).toLowerCase().trim();
      const isConsult = compStr === '2' || compStr === 'consultancy' || compStr.includes('consult') || compStr === 'print';
      const isTech = compStr === '1' || compStr === 'tech' || compStr.includes('tech');
      
      const candidateKeys = [
        `${key}_${companyId}`,
        isConsult ? `${key}_consultancy` : null,
        isConsult ? `${key}_2` : null,
        isConsult ? `${key}_print` : null,
        isTech ? `${key}_tech` : null,
        isTech ? `${key}_1` : null,
        key // Fallback to root key
      ].filter(Boolean);

      let foundData = null;

      for (const cKey of candidateKeys) {
        let compRows = [];
        try {
          const [rows] = await activePool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [cKey]);
          compRows = rows;
        } catch (err) {
          try {
            const [fallbackRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [cKey]);
            compRows = fallbackRows;
          } catch {}
        }

        if (compRows.length > 0 && compRows[0].data_json) {
          try {
            const parsedComp = JSON.parse(compRows[0].data_json);
            if (Array.isArray(parsedComp) && parsedComp.length > 0) {
              const filtered = parsedComp.filter(item => {
                if (!item) return false;
                const idStr = item.id !== undefined && item.id !== null ? String(item.id).toLowerCase().trim() : '';
                const emailStr = item.email ? String(item.email).toLowerCase().trim() : '';
                if (idStr && deletedSet.has(idStr)) return false;
                if (emailStr && deletedSet.has(emailStr)) return false;
                return true;
              });

              // If it's the root key fallback, filter items by company if items have companyId
              if (cKey === key && filtered.length > 0) {
                const compFiltered = filtered.filter(item => {
                  const itemComp = String(item.companyId || item.company_id || item.company || '').toLowerCase().trim();
                  if (!itemComp) return true; // Global / unassigned item
                  if (isConsult && (itemComp === 'consultancy' || itemComp === '2' || itemComp === 'print')) return true;
                  if (isTech && (itemComp === 'tech' || itemComp === '1')) return true;
                  return itemComp === compStr;
                });
                if (compFiltered.length > 0) {
                  foundData = compFiltered;
                  break;
                }
                // If no company-specific match, fall back to filtered items for shared entities like clients
                if (key === 'clients' || key === 'client_labels' || key === 'categories') {
                  foundData = filtered;
                  break;
                }
              } else if (filtered.length > 0) {
                foundData = filtered;
                break;
              }
            } else if (!Array.isArray(parsedComp) && typeof parsedComp === 'object' && Object.keys(parsedComp).length > 0) {
              foundData = parsedComp;
              break;
            }
          } catch {}
        }
      }

      if (foundData !== null) {
        return successResponse(res, 200, 'Company-isolated module data fetched from MySQL', foundData);
      }

      return successResponse(res, 200, 'Company module data fetched', []);
    }

    // 2. Query all matching module keys when companyId is 'all' or omitted
    const [rows] = await activePool.execute(
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
    let activePool = pool;
    try {
      if (pool.getCompanyPool) activePool = pool.getCompanyPool(targetCompanyId);
    } catch {
      activePool = pool;
    }

    // Save to company key(s) if targetCompanyId is specified
    if (targetCompanyId && targetCompanyId !== 'all') {
      const compStr = String(targetCompanyId).toLowerCase().trim();
      const isConsult = compStr === '2' || compStr === 'consultancy' || compStr.includes('consult') || compStr === 'print';
      const isTech = compStr === '1' || compStr === 'tech' || compStr.includes('tech');

      const keysToSave = new Set([`${key}_${targetCompanyId}`]);
      if (isConsult) {
        keysToSave.add(`${key}_consultancy`);
        keysToSave.add(`${key}_2`);
      }
      if (isTech) {
        keysToSave.add(`${key}_tech`);
        keysToSave.add(`${key}_1`);
      }

      for (const saveK of keysToSave) {
        try {
          await pool.execute(
            `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
            [saveK, dataJson]
          );
        } catch {}
      }

      // Also merge items into root key if data is an array
      if (Array.isArray(data)) {
        try {
          const [rootRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = ?', [key]);
          let rootList = [];
          if (rootRows.length > 0 && rootRows[0].data_json) {
            try { rootList = JSON.parse(rootRows[0].data_json); } catch {}
          }
          if (Array.isArray(rootList)) {
            const rootMap = new Map();
            rootList.forEach(item => {
              if (item && item.id !== undefined && item.id !== null) {
                rootMap.set(String(item.id).toLowerCase().trim(), item);
              }
            });
            data.forEach(item => {
              if (item && item.id !== undefined && item.id !== null) {
                rootMap.set(String(item.id).toLowerCase().trim(), item);
              }
            });
            const merged = Array.from(rootMap.values());
            await pool.execute(
              `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
               ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
              [key, JSON.stringify(merged)]
            ).catch(() => {});
          }
        } catch {}
      }
    } else {
      // Save to global key
      try {
        await activePool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [key, dataJson]
        );
      } catch (saveErr) {
        if (activePool !== pool) {
          await pool.execute(
            `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
            [key, dataJson]
          );
        } else {
          throw saveErr;
        }
      }
    }

    return successResponse(res, 200, 'Module data saved to MySQL database successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStoreData, saveStoreData };
