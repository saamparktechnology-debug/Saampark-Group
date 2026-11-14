const { successResponse, errorResponse } = require('../utils/apiResponse');
const branchModel = require('../models/branchModel');
const subBranchModel = require('../models/subBranchModel');

const branchController = {
  async getAll(req, res) {
    try {
      const reqCompanyId = req.headers['x-company-id'];
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      const isSuperAdmin = userRoleId === 1 || userRole.includes('super');

      let companyId;
      if (isSuperAdmin) {
        companyId = (reqCompanyId && reqCompanyId !== 'all') ? reqCompanyId : null;
      } else {
        // Enforce user's assigned company scope
        let userComps = [req.user?.company_id];
        if (req.user?.company_ids) {
          try {
            const parsed = typeof req.user.company_ids === 'string' ? JSON.parse(req.user.company_ids) : req.user.company_ids;
            if (Array.isArray(parsed)) userComps.push(...parsed);
          } catch {}
        }
        userComps = userComps.filter(Boolean).map(c => String(c).toLowerCase().trim());
        if (reqCompanyId && reqCompanyId !== 'all') {
          const reqNorm = String(reqCompanyId).toLowerCase().trim();
          const isAllowed = userComps.includes(reqNorm);
          if (!isAllowed) {
            return errorResponse(res, 403, 'Access denied: You do not have permission to view branches for this company');
          }
          companyId = reqCompanyId;
        } else {
          companyId = req.user?.company_id;
        }
      }

      let resolvedCompanyId = companyId;
      if (companyId && isNaN(Number(companyId))) {
        const pool = require('../config/db');
        const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [companyId, companyId]).catch(() => [[]]);
        if (compRows && compRows.length > 0) {
          resolvedCompanyId = compRows[0].id;
        }
      }

      const branches = resolvedCompanyId
        ? await branchModel.findByCompany(resolvedCompanyId)
        : await branchModel.findAll();
      return successResponse(res, 200, 'Branches fetched', branches);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async getById(req, res) {
    try {
      const branch = await branchModel.findById(req.params.id);
      if (!branch) return errorResponse(res, 404, 'Branch not found');
      return successResponse(res, 200, 'Branch fetched', branch);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async create(req, res) {
    try {
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      const isSuperAdmin = userRoleId === 1 || userRole.includes('super');

      let companyId;
      if (isSuperAdmin) {
        companyId = req.headers['x-company-id'] || req.body.company_id || req.user?.company_id;
      } else {
        companyId = req.user?.company_id;
      }
      if (!companyId || companyId === 'all') companyId = req.body.company_id || req.user?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID required');

      let resolvedCompanyId = companyId;
      if (isNaN(Number(companyId))) {
        const pool = require('../config/db');
        const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [companyId, companyId]).catch(() => [[]]);
        if (compRows && compRows.length > 0) {
          resolvedCompanyId = compRows[0].id;
        } else {
          resolvedCompanyId = String(companyId).toLowerCase().includes('consult') || String(companyId) === '2' ? 2 : 1;
        }
      }

      const id = await branchModel.create({ ...req.body, company_id: resolvedCompanyId });
      return successResponse(res, 201, 'Branch created', { id, company_id: resolvedCompanyId });
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async update(req, res) {
    try {
      await branchModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Branch updated');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async delete(req, res) {
    return errorResponse(res, 403, 'Branches cannot be deleted once created. They can only be edited or updated.');
  },

  async getStats(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const stats = await branchModel.getStats(companyId);
      return successResponse(res, 200, 'Stats fetched', stats);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

const subBranchController = {
  async getAll(req, res) {
    try {
      const reqCompanyId = req.headers['x-company-id'];
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      const isSuperAdmin = userRoleId === 1 || userRole.includes('super');
      const { branch_id } = req.query;

      let subBranches;
      if (branch_id) {
        subBranches = await subBranchModel.findByBranch(branch_id);
      } else if (isSuperAdmin) {
        if (reqCompanyId && reqCompanyId !== 'all') {
          let resolvedCompanyId = reqCompanyId;
          if (isNaN(Number(reqCompanyId))) {
            const pool = require('../config/db');
            const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [reqCompanyId, reqCompanyId]).catch(() => [[]]);
            if (compRows && compRows.length > 0) resolvedCompanyId = compRows[0].id;
          }
          subBranches = await subBranchModel.findByCompany(resolvedCompanyId);
        } else {
          // Super Admin gets all sub-branches across all companies
          subBranches = await subBranchModel.findAll();
        }
      } else {
        // Enforce user's assigned company
        let assignedComp = req.user?.company_id || 1;
        if (isNaN(Number(assignedComp))) {
          const pool = require('../config/db');
          const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [assignedComp, assignedComp]).catch(() => [[]]);
          if (compRows && compRows.length > 0) assignedComp = compRows[0].id;
        }
        subBranches = await subBranchModel.findByCompany(assignedComp);
      }
      return successResponse(res, 200, 'Sub-branches fetched', subBranches);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async getById(req, res) {
    try {
      const subBranch = await subBranchModel.findById(req.params.id);
      if (!subBranch) return errorResponse(res, 404, 'Sub-branch not found');
      return successResponse(res, 200, 'Sub-branch fetched', subBranch);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async create(req, res) {
    try {
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      const isSuperAdmin = userRoleId === 1 || userRole.includes('super');

      let companyId;
      if (isSuperAdmin) {
        companyId = req.headers['x-company-id'] || req.body.company_id || req.user?.company_id;
      } else {
        companyId = req.user?.company_id;
      }
      if (!companyId || companyId === 'all') companyId = req.body.company_id || req.user?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID required');

      const pool = require('../config/db');
      let resolvedCompanyId = null;
      if (companyId && !isNaN(Number(companyId))) {
        const [cRows] = await pool.execute('SELECT id FROM companies WHERE id = ?', [Number(companyId)]).catch(() => [[]]);
        if (cRows && cRows.length > 0) resolvedCompanyId = cRows[0].id;
      }
      if (!resolvedCompanyId && companyId) {
        const [cRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ? OR LOWER(name) = LOWER(?)', [companyId, companyId, String(companyId)]).catch(() => [[]]);
        if (cRows && cRows.length > 0) resolvedCompanyId = cRows[0].id;
      }
      if (!resolvedCompanyId) {
        const [cRows] = await pool.execute('SELECT id FROM companies ORDER BY id ASC LIMIT 1').catch(() => [[]]);
        resolvedCompanyId = cRows && cRows.length > 0 ? cRows[0].id : 1;
      }

      let rawBranchId = req.body.branch_id || req.body.parentBranchId;
      let resolvedBranchId = null;

      // 1. Try finding by numeric id if rawBranchId is a valid number
      if (rawBranchId && !isNaN(Number(rawBranchId))) {
        const [bRows] = await pool.execute('SELECT id FROM branches WHERE id = ?', [Number(rawBranchId)]).catch(() => [[]]);
        if (bRows && bRows.length > 0) resolvedBranchId = bRows[0].id;
      }

      // 2. Try finding by code, name, slug, or stripped prefix (e.g. br-1)
      if (!resolvedBranchId && rawBranchId) {
        const cleanId = String(rawBranchId).replace(/^br-/, '');
        const [bRows] = await pool.execute(
          'SELECT id FROM branches WHERE id = ? OR code = ? OR name = ? OR LOWER(name) = LOWER(?) OR id = ?',
          [rawBranchId, rawBranchId, rawBranchId, String(rawBranchId), cleanId]
        ).catch(() => [[]]);
        if (bRows && bRows.length > 0) resolvedBranchId = bRows[0].id;
      }

      // 3. Check app_data branches if not found in MySQL
      if (!resolvedBranchId) {
        try {
          const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
          if (appRows && appRows.length > 0) {
            const bList = JSON.parse(appRows[0].data_json);
            if (Array.isArray(bList) && bList.length > 0) {
              const matched = rawBranchId
                ? bList.find(b => String(b.id) === String(rawBranchId) || String(b.code) === String(rawBranchId) || String(b.name) === String(rawBranchId))
                : bList[0];
              const chosen = matched || bList[0];
              if (chosen) {
                // Ensure this chosen branch exists in MySQL branches table
                const [ins] = await pool.execute(
                  'INSERT INTO branches (name, company_id, code, city, state, address, phone, email, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                  [
                    chosen.name || 'Main Operational Branch',
                    resolvedCompanyId,
                    chosen.code || `BR-${resolvedCompanyId}01`,
                    chosen.city || null,
                    chosen.state || null,
                    chosen.address || null,
                    chosen.phone || null,
                    chosen.email || null
                  ]
                ).catch(() => [null]);
                if (ins && ins.insertId) resolvedBranchId = ins.insertId;
              }
            }
          }
        } catch (e) {}
      }

      // 4. Auto-provision a default head branch for this company if none exists
      if (!resolvedBranchId) {
        try {
          const [ins] = await pool.execute(
            'INSERT INTO branches (name, company_id, code, city, state, is_active) VALUES (?, ?, ?, ?, ?, 1)',
            ['Main Operational Branch', resolvedCompanyId, `BR-${resolvedCompanyId}01`, 'Kolkata', 'West Bengal']
          );
          resolvedBranchId = ins.insertId;
        } catch (e) {
          resolvedBranchId = 1;
        }
      }

      const id = await subBranchModel.create({ ...req.body, branch_id: resolvedBranchId, company_id: resolvedCompanyId });

      // Sync into app_data JSON store so it immediately persists across sessions/devices
      try {
        const [appRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
        let currentList = [];
        if (appRows && appRows.length > 0) {
          try { currentList = JSON.parse(appRows[0].data_json); } catch {}
        }
        if (!Array.isArray(currentList)) currentList = [];
        const fullSub = {
          ...req.body,
          id: id,
          branch_id: resolvedBranchId,
          parentBranchId: String(resolvedBranchId),
          company_id: resolvedCompanyId,
          companyId: String(req.body.companyId || resolvedCompanyId)
        };
        const filtered = currentList.filter(s => String(s.id) !== String(id) && (!s.code || s.code !== fullSub.code));
        await pool.execute(
          `INSERT INTO app_data (module_key, data_json) VALUES ('sub_branches', ?)
           ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
          [JSON.stringify([fullSub, ...filtered])]
        );
      } catch (e) {}

      return successResponse(res, 201, 'Sub-branch created', { id, company_id: resolvedCompanyId, branch_id: resolvedBranchId });
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async update(req, res) {
    try {
      await subBranchModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Sub-branch updated');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async delete(req, res) {
    try {
      await subBranchModel.delete(req.params.id);
      return successResponse(res, 200, 'Sub-branch deleted successfully');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = { branchController, subBranchController };

