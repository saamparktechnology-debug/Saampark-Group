const { successResponse, errorResponse } = require('../utils/apiResponse');
const { knowledgeBaseModel, slaModel, notificationModel, messageTemplateModel, documentModel, auditLogModel, reminderModel } = require('../models/supportModel');

const knowledgeBaseController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { category, search, page, limit } = req.query;
      const articles = await knowledgeBaseModel.findByCompany(companyId, { category, search, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Articles fetched', articles);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const article = await knowledgeBaseModel.findById(req.params.id);
      if (!article) return errorResponse(res, 404, 'Article not found');
      await knowledgeBaseModel.incrementViews(req.params.id);
      return successResponse(res, 200, 'Article fetched', article);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await knowledgeBaseModel.create({ ...req.body, company_id: companyId, created_by: req.user?.id });
      return successResponse(res, 201, 'Article created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await knowledgeBaseModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Article updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await knowledgeBaseModel.delete(req.params.id);
      return successResponse(res, 200, 'Article deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const slaController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const slas = await slaModel.findByCompany(companyId);
      return successResponse(res, 200, 'SLA policies fetched', slas);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await slaModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'SLA created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await slaModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'SLA updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await slaModel.delete(req.params.id);
      return successResponse(res, 200, 'SLA deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const notificationController = {
  async getAll(req, res) {
    try {
      const { unread_only, page, limit } = req.query;
      const notifications = await notificationModel.findByUser(req.user?.id, { unread_only: unread_only === 'true', page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Notifications fetched', notifications);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async markRead(req, res) {
    try {
      await notificationModel.markRead(req.params.id);
      return successResponse(res, 200, 'Notification marked as read');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async markAllRead(req, res) {
    try {
      await notificationModel.markAllRead(req.user?.id);
      return successResponse(res, 200, 'All notifications marked as read');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getUnreadCount(req, res) {
    try {
      const count = await notificationModel.getUnreadCount(req.user?.id);
      return successResponse(res, 200, 'Unread count', { count });
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const messageTemplateController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { type } = req.query;
      const templates = await messageTemplateModel.findByCompany(companyId, type);
      return successResponse(res, 200, 'Templates fetched', templates);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await messageTemplateModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Template created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await messageTemplateModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Template updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await messageTemplateModel.delete(req.params.id);
      return successResponse(res, 200, 'Template deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const documentController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { module_type, category, page, limit } = req.query;
      const docs = await documentModel.findByCompany(companyId, { module_type, category, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Documents fetched', docs);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const doc = await documentModel.findById(req.params.id);
      if (!doc) return errorResponse(res, 404, 'Document not found');
      return successResponse(res, 200, 'Document fetched', doc);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await documentModel.create({ ...req.body, company_id: companyId, uploaded_by: req.user?.id });
      return successResponse(res, 201, 'Document uploaded', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await documentModel.delete(req.params.id);
      return successResponse(res, 200, 'Document deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getExpiring(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { days } = req.query;
      const docs = await documentModel.getExpiring(companyId, parseInt(days) || 30);
      return successResponse(res, 200, 'Expiring documents', docs);
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const auditLogController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { module, user_id, page, limit } = req.query;
      const logs = await auditLogModel.findByCompany(companyId, { module, user_id, page: parseInt(page) || 1, limit: parseInt(limit) || 100 });
      return successResponse(res, 200, 'Audit logs fetched', logs);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      await auditLogModel.create({ ...req.body, user_id: req.user?.id, ip_address: req.ip, user_agent: req.get('user-agent') });
      return successResponse(res, 201, 'Audit log created');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const reminderController = {
  async getMy(req, res) {
    try {
      const reminders = await reminderModel.findByUser(req.user?.id);
      return successResponse(res, 200, 'Reminders fetched', reminders);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await reminderModel.create({ ...req.body, company_id: companyId, user_id: req.user?.id });
      return successResponse(res, 201, 'Reminder created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await reminderModel.delete(req.params.id);
      return successResponse(res, 200, 'Reminder deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { knowledgeBaseController, slaController, notificationController, messageTemplateController, documentController, auditLogController, reminderController };
