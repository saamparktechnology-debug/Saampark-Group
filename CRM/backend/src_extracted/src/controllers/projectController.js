const { successResponse, errorResponse } = require('../utils/apiResponse');
const { projectModel, milestoneModel, subtaskModel, timesheetModel } = require('../models/projectModel');

const projectController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, page, limit } = req.query;
      const result = await projectModel.findByCompany(companyId, { status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Projects fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const project = await projectModel.findById(req.params.id);
      if (!project) return errorResponse(res, 404, 'Project not found');
      const milestones = await milestoneModel.findByProject(req.params.id);
      return successResponse(res, 200, 'Project fetched', { ...project, milestones });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await projectModel.create({ ...req.body, company_id: companyId, created_by: req.user?.id });
      return successResponse(res, 201, 'Project created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await projectModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Project updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await projectModel.delete(req.params.id);
      return successResponse(res, 200, 'Project deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const milestoneController = {
  async getByProject(req, res) {
    try {
      const milestones = await milestoneModel.findByProject(req.params.projectId);
      return successResponse(res, 200, 'Milestones fetched', milestones);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const id = await milestoneModel.create(req.body);
      return successResponse(res, 201, 'Milestone created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await milestoneModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Milestone updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await milestoneModel.delete(req.params.id);
      return successResponse(res, 200, 'Milestone deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const subtaskController = {
  async getByTask(req, res) {
    try {
      const subtasks = await subtaskModel.findByTask(req.params.taskId);
      return successResponse(res, 200, 'Subtasks fetched', subtasks);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const id = await subtaskModel.create(req.body);
      return successResponse(res, 201, 'Subtask created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await subtaskModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Subtask updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await subtaskModel.delete(req.params.id);
      return successResponse(res, 200, 'Subtask deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const timesheetController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { employee_id, project_id, from_date, to_date, page, limit } = req.query;
      const timesheets = await timesheetModel.findByCompany(companyId, { employee_id, project_id, from_date, to_date, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Timesheets fetched', timesheets);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await timesheetModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Timesheet entry created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async approve(req, res) {
    try {
      await timesheetModel.approve(req.params.id, req.user?.id);
      return successResponse(res, 200, 'Timesheet approved');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await timesheetModel.delete(req.params.id);
      return successResponse(res, 200, 'Timesheet deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { projectController, milestoneController, subtaskController, timesheetController };
