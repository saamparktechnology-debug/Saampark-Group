const { successResponse, errorResponse } = require('../utils/apiResponse');
const departmentModel = require('../models/departmentModel');
const designationModel = require('../models/designationModel');
const teamModel = require('../models/teamModel');

const departmentController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const departments = await departmentModel.findByCompany(companyId);
      return successResponse(res, 200, 'Departments fetched', departments);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getById(req, res) {
    try {
      const dept = await departmentModel.findById(req.params.id);
      if (!dept) return errorResponse(res, 404, 'Department not found');
      return successResponse(res, 200, 'Department fetched', dept);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await departmentModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Department created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async update(req, res) {
    try {
      await departmentModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Department updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async delete(req, res) {
    try {
      await departmentModel.delete(req.params.id);
      return successResponse(res, 200, 'Department deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const designationController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const designations = await designationModel.findByCompany(companyId);
      return successResponse(res, 200, 'Designations fetched', designations);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await designationModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Designation created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async update(req, res) {
    try {
      await designationModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Designation updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async delete(req, res) {
    try {
      await designationModel.delete(req.params.id);
      return successResponse(res, 200, 'Designation deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const teamController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const teams = await teamModel.findByCompany(companyId);
      return successResponse(res, 200, 'Teams fetched', teams);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async getById(req, res) {
    try {
      const team = await teamModel.findById(req.params.id);
      if (!team) return errorResponse(res, 404, 'Team not found');
      const members = await teamModel.getMembers(req.params.id);
      return successResponse(res, 200, 'Team fetched', { ...team, members });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await teamModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Team created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async addMember(req, res) {
    try {
      await teamModel.addMember(req.params.id, req.body.user_id, req.body.role_in_team);
      return successResponse(res, 200, 'Member added');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async removeMember(req, res) {
    try {
      await teamModel.removeMember(req.params.id, req.params.userId);
      return successResponse(res, 200, 'Member removed');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async update(req, res) {
    try {
      await teamModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Team updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },

  async delete(req, res) {
    try {
      await teamModel.delete(req.params.id);
      return successResponse(res, 200, 'Team deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { departmentController, designationController, teamController };
