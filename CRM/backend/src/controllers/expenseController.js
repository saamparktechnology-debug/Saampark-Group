const { successResponse, errorResponse } = require('../utils/apiResponse');
const expenseModel = require('../models/expenseModel');

const expenseController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id || 'tech';
      const branchId = req.headers['x-branch-id'] || req.user?.branch_id || req.query.branch_id;
      const filters = {
        status: req.query.status,
        category: req.query.category,
        projectId: req.query.projectId,
        branch_id: branchId,
      };
      const items = await expenseModel.findByCompany(companyId, filters);
      return successResponse(res, 200, 'Expenses fetched', items);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async getById(req, res) {
    try {
      const item = await expenseModel.findById(req.params.id);
      if (!item) return errorResponse(res, 404, 'Expense not found');
      return successResponse(res, 200, 'Expense fetched', item);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id || 'tech';
      const createdBy = req.user?.id || req.user?.email || 'admin';
      const result = await expenseModel.create({
        ...req.body,
        company_id: companyId,
        created_by: createdBy,
      });
      return successResponse(res, 201, 'Expense created', result);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async update(req, res) {
    try {
      await expenseModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Expense updated');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
        return errorResponse(res, 400, 'Invalid status');
      }
      await expenseModel.updateStatus(req.params.id, status);
      return successResponse(res, 200, `Expense status updated to ${status}`);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async delete(req, res) {
    try {
      await expenseModel.delete(req.params.id);
      return successResponse(res, 200, 'Expense deleted');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async getStats(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id || 'tech';
      const stats = await expenseModel.getStats(companyId);
      return successResponse(res, 200, 'Expense stats fetched', stats);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = expenseController;
