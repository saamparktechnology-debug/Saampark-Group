const { successResponse, errorResponse } = require('../utils/apiResponse');
const vendorModel = require('../models/vendorModel');

const vendorController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { search, status, page, limit } = req.query;
      const result = await vendorModel.findByCompany(companyId, { search, status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Vendors fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getById(req, res) {
    try {
      const vendor = await vendorModel.findById(req.params.id);
      if (!vendor) return errorResponse(res, 404, 'Vendor not found');
      return successResponse(res, 200, 'Vendor fetched', vendor);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await vendorModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Vendor created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async update(req, res) {
    try {
      await vendorModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Vendor updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async delete(req, res) {
    try {
      await vendorModel.delete(req.params.id);
      return successResponse(res, 200, 'Vendor deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getStats(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const stats = await vendorModel.getStats(companyId);
      return successResponse(res, 200, 'Stats fetched', stats);
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = vendorController;
