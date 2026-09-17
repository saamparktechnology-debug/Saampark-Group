const { successResponse, errorResponse } = require('../utils/apiResponse');
const { enquiryModel, followUpModel, callModel, meetingModel, noteModel, activityTimelineModel } = require('../models/crmCoreModel');

const enquiryController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, priority, assigned_to, page, limit } = req.query;
      const result = await enquiryModel.findByCompany(companyId, { status, priority, assigned_to, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Enquiries fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const enquiry = await enquiryModel.findById(req.params.id);
      if (!enquiry) return errorResponse(res, 404, 'Enquiry not found');
      return successResponse(res, 200, 'Enquiry fetched', enquiry);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await enquiryModel.create({ ...req.body, company_id: companyId, created_by: req.user?.id });
      return successResponse(res, 201, 'Enquiry created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await enquiryModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Enquiry updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await enquiryModel.delete(req.params.id);
      return successResponse(res, 200, 'Enquiry deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const followUpController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, assigned_to, page, limit } = req.query;
      const result = await followUpModel.findByCompany(companyId, { status, assigned_to, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Follow-ups fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const followUp = await followUpModel.findById(req.params.id);
      if (!followUp) return errorResponse(res, 404, 'Follow-up not found');
      return successResponse(res, 200, 'Follow-up fetched', followUp);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await followUpModel.create({ ...req.body, company_id: companyId, created_by: req.user?.id });
      return successResponse(res, 201, 'Follow-up created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await followUpModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Follow-up updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await followUpModel.delete(req.params.id);
      return successResponse(res, 200, 'Follow-up deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const callController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { lead_id, customer_id, page, limit } = req.query;
      const calls = await callModel.findByCompany(companyId, { lead_id, customer_id, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Calls fetched', calls);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await callModel.create({ ...req.body, company_id: companyId, called_by: req.user?.id });
      return successResponse(res, 201, 'Call logged', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await callModel.delete(req.params.id);
      return successResponse(res, 200, 'Call deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const meetingController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, page, limit } = req.query;
      const meetings = await meetingModel.findByCompany(companyId, { status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Meetings fetched', meetings);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const meeting = await meetingModel.findById(req.params.id);
      if (!meeting) return errorResponse(res, 404, 'Meeting not found');
      return successResponse(res, 200, 'Meeting fetched', meeting);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await meetingModel.create({ ...req.body, company_id: companyId, organized_by: req.user?.id });
      return successResponse(res, 201, 'Meeting created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await meetingModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Meeting updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await meetingModel.delete(req.params.id);
      return successResponse(res, 200, 'Meeting deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const noteController = {
  async getByModule(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { module_type, module_id } = req.params;
      const notes = await noteModel.findByModule(companyId, module_type, module_id);
      return successResponse(res, 200, 'Notes fetched', notes);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await noteModel.create({ ...req.body, company_id: companyId, created_by: req.user?.id });
      return successResponse(res, 201, 'Note created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await noteModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Note updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await noteModel.delete(req.params.id);
      return successResponse(res, 200, 'Note deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const activityController = {
  async getByModule(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { module_type, module_id } = req.params;
      const { page, limit } = req.query;
      const activities = await activityTimelineModel.findByModule(companyId, module_type, module_id, { page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Activities fetched', activities);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { module_type, page, limit } = req.query;
      const activities = await activityTimelineModel.findByCompany(companyId, { module_type, page: parseInt(page) || 1, limit: parseInt(limit) || 100 });
      return successResponse(res, 200, 'Activities fetched', activities);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      await activityTimelineModel.create({ ...req.body, company_id: companyId, performed_by: req.user?.id, ip_address: req.ip });
      return successResponse(res, 201, 'Activity logged');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { enquiryController, followUpController, callController, meetingController, noteController, activityController };
