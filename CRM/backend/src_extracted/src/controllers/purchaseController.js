const { successResponse, errorResponse } = require('../utils/apiResponse');
const { purchaseOrderModel, purchaseInvoiceModel, purchaseReturnModel } = require('../models/purchaseModel');

const purchaseOrderController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, page, limit } = req.query;
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      const result = await purchaseOrderModel.findByCompany(companyId, { status, branch_id: branchId, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Purchase orders fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const po = await purchaseOrderModel.findById(req.params.id);
      if (!po) return errorResponse(res, 404, 'Purchase order not found');
      return successResponse(res, 200, 'Purchase order fetched', po);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM purchase_orders WHERE company_id = ?', [companyId]);
      const num = `PO-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await purchaseOrderModel.create({ ...req.body, company_id: companyId, order_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Purchase order created', { id, order_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await purchaseOrderModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Purchase order updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await purchaseOrderModel.delete(req.params.id);
      return successResponse(res, 200, 'Purchase order deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const purchaseInvoiceController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { status, page, limit } = req.query;
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      const result = await purchaseInvoiceModel.findByCompany(companyId, { status, branch_id: branchId, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Purchase invoices fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const pi = await purchaseInvoiceModel.findById(req.params.id);
      if (!pi) return errorResponse(res, 404, 'Purchase invoice not found');
      return successResponse(res, 200, 'Purchase invoice fetched', pi);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM purchase_invoices WHERE company_id = ?', [companyId]);
      const num = `PINV-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await purchaseInvoiceModel.create({ ...req.body, company_id: companyId, invoice_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Purchase invoice created', { id, invoice_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await purchaseInvoiceModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Purchase invoice updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await purchaseInvoiceModel.delete(req.params.id);
      return successResponse(res, 200, 'Purchase invoice deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const purchaseReturnController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const returns = await purchaseReturnModel.findByCompany(companyId);
      return successResponse(res, 200, 'Purchase returns fetched', returns);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM purchase_returns WHERE company_id = ?', [companyId]);
      const num = `PR-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await purchaseReturnModel.create({ ...req.body, company_id: companyId, return_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Purchase return created', { id, return_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await purchaseReturnModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Purchase return updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { purchaseOrderController, purchaseInvoiceController, purchaseReturnController };
