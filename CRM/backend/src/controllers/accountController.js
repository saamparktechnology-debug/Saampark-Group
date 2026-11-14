const { successResponse, errorResponse } = require('../utils/apiResponse');
const { transactionModel, bankAccountModel, chartOfAccountsModel, categoryModel, taxRateModel } = require('../models/accountModel');

const transactionController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { type, category, from_date, to_date, page, limit } = req.query;
      const transactions = await transactionModel.findByCompany(companyId, { type, category, from_date, to_date, page: parseInt(page) || 1, limit: parseInt(limit) || 100 });
      return successResponse(res, 200, 'Transactions fetched', transactions);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const tx = await transactionModel.findById(req.params.id);
      if (!tx) return errorResponse(res, 404, 'Transaction not found');
      return successResponse(res, 200, 'Transaction fetched', tx);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM transactions WHERE company_id = ?', [companyId]);
      const num = `TXN-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await transactionModel.create({ ...req.body, company_id: companyId, transaction_number: num, created_by: req.user?.id });

      if (req.body.bank_account_id) {
        const amt = req.body.type === 'income' ? req.body.amount : -req.body.amount;
        await bankAccountModel.updateBalance(req.body.bank_account_id, amt);
      }

      return successResponse(res, 201, 'Transaction created', { id, transaction_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getSummary(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { from_date, to_date } = req.query;
      const summary = await transactionModel.getSummary(companyId, { from_date, to_date });
      return successResponse(res, 200, 'Summary fetched', summary);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await transactionModel.delete(req.params.id);
      return successResponse(res, 200, 'Transaction deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const bankAccountController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const accounts = await bankAccountModel.findByCompany(companyId);
      return successResponse(res, 200, 'Bank accounts fetched', accounts);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const account = await bankAccountModel.findById(req.params.id);
      if (!account) return errorResponse(res, 404, 'Bank account not found');
      return successResponse(res, 200, 'Bank account fetched', account);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await bankAccountModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Bank account created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await bankAccountModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Bank account updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await bankAccountModel.delete(req.params.id);
      return successResponse(res, 200, 'Bank account deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const chartOfAccountsController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const accounts = await chartOfAccountsModel.findByCompany(companyId);
      return successResponse(res, 200, 'Chart of accounts fetched', accounts);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await chartOfAccountsModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Account created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await chartOfAccountsModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Account updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await chartOfAccountsModel.delete(req.params.id);
      return successResponse(res, 200, 'Account deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const categoryController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { type } = req.query;
      const categories = await categoryModel.findByCompany(companyId, type);
      return successResponse(res, 200, 'Categories fetched', categories);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await categoryModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Category created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await categoryModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Category updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await categoryModel.delete(req.params.id);
      return successResponse(res, 200, 'Category deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const taxRateController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const taxes = await taxRateModel.findByCompany(companyId);
      return successResponse(res, 200, 'Tax rates fetched', taxes);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const id = await taxRateModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Tax rate created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await taxRateModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Tax rate updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await taxRateModel.delete(req.params.id);
      return successResponse(res, 200, 'Tax rate deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { transactionController, bankAccountController, chartOfAccountsController, categoryController, taxRateController };
