const { successResponse, errorResponse } = require('../utils/apiResponse');
const branchModel = require('../models/branchModel');
const subBranchModel = require('../models/subBranchModel');

const branchController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const isSuperAdmin = req.user?.role_id === 1;
      // Super Admin can get all branches across all companies
      if (!companyId && !isSuperAdmin) return errorResponse(res, 400, 'Company ID required');
      const branches = companyId
        ? await branchModel.findByCompany(companyId)
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
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID required');
      const id = await branchModel.create({ ...req.body, company_id: companyId });
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
      await branchModel.delete(req.params.id);
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
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const isSuperAdmin = req.user?.role_id === 1;
      const { branch_id } = req.query;
      let subBranches;
      if (branch_id) {
        subBranches = await subBranchModel.findByBranch(branch_id);
      } else if (companyId) {
        subBranches = await subBranchModel.findByCompany(companyId);
      } else if (isSuperAdmin) {
        // Super Admin gets all sub-branches across all companies
        subBranches = await subBranchModel.findAll();
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
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await subBranchModel.create({ ...req.body, company_id: companyId });
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
      await subBranchModel.delete(req.params.id);
      return successResponse(res, 200, 'Sub-branch deleted');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = { branchController, subBranchController };

