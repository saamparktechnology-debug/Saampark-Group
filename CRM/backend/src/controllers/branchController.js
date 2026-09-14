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

      const companyId = (reqCompanyId && reqCompanyId !== 'all')
        ? reqCompanyId
        : (isSuperAdmin ? null : req.user?.company_id);

      // Super Admin can get all branches across all companies
      if (!companyId && !isSuperAdmin) return errorResponse(res, 400, 'Company ID required');

      let resolvedCompanyId = companyId;
      if (companyId && isNaN(Number(companyId))) {
        const pool = require('../config/db');
        const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [companyId, companyId]).catch(() => [[]]);
        if (compRows && compRows.length > 0) {
          resolvedCompanyId = compRows[0].id;
        } else if (companyId === 'tech') {
          resolvedCompanyId = 1;
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
      let companyId = req.headers['x-company-id'] || req.body.company_id || req.user?.company_id;
      if (!companyId || companyId === 'all') companyId = req.body.company_id || req.user?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID required');

      let resolvedCompanyId = companyId;
      if (isNaN(Number(companyId))) {
        const pool = require('../config/db');
        const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [companyId, companyId]).catch(() => [[]]);
        if (compRows && compRows.length > 0) {
          resolvedCompanyId = compRows[0].id;
        } else if (companyId === 'tech') {
          resolvedCompanyId = 1;
        }
      }

      const id = await branchModel.create({ ...req.body, company_id: resolvedCompanyId });
      return successResponse(res, 201, 'Branch created', { id });
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
    try {
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      if (userRoleId !== 1 && !userRole.includes('super')) {
        return errorResponse(res, 403, 'Access denied: Only Super Admin can delete branches.');
      }
      const branchId = req.params.id;
      const pool = require('../config/db');
      await pool.execute('DELETE FROM sub_branches WHERE branch_id = ?', [branchId]).catch(() => {});
      await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "branches")', [String(branchId)]).catch(() => {});
      await branchModel.delete(branchId);
      return successResponse(res, 200, 'Branch deleted');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
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
      } else if (reqCompanyId && reqCompanyId !== 'all') {
        let resolvedCompanyId = reqCompanyId;
        if (isNaN(Number(reqCompanyId))) {
          const pool = require('../config/db');
          const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [reqCompanyId, reqCompanyId]).catch(() => [[]]);
          if (compRows && compRows.length > 0) resolvedCompanyId = compRows[0].id;
          else if (reqCompanyId === 'tech') resolvedCompanyId = 1;
        }
        subBranches = await subBranchModel.findByCompany(resolvedCompanyId);
      } else if (isSuperAdmin) {
        // Super Admin gets all sub-branches across all companies
        subBranches = await subBranchModel.findAll();
      } else if (req.user?.company_id) {
        subBranches = await subBranchModel.findByCompany(req.user.company_id);
      } else {
        subBranches = [];
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
      let companyId = req.headers['x-company-id'] || req.body.company_id || req.user?.company_id;
      if (!companyId || companyId === 'all') companyId = req.body.company_id || req.user?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID required');

      let resolvedCompanyId = companyId;
      if (isNaN(Number(companyId))) {
        const pool = require('../config/db');
        const [compRows] = await pool.execute('SELECT id FROM companies WHERE slug = ? OR name = ?', [companyId, companyId]).catch(() => [[]]);
        if (compRows && compRows.length > 0) resolvedCompanyId = compRows[0].id;
        else if (companyId === 'tech') resolvedCompanyId = 1;
      }

      const id = await subBranchModel.create({ ...req.body, company_id: resolvedCompanyId });
      return successResponse(res, 201, 'Sub-branch created', { id });
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
      const userRoleId = Number(req.user?.role_id);
      const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
      if (userRoleId !== 1 && !userRole.includes('super')) {
        return errorResponse(res, 403, 'Access denied: Only Super Admin can delete sub-branches.');
      }
      const subBranchId = req.params.id;
      const pool = require('../config/db');
      await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "sub_branches")', [String(subBranchId)]).catch(() => {});
      await subBranchModel.delete(subBranchId);
      return successResponse(res, 200, 'Sub-branch deleted');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = { branchController, subBranchController };

