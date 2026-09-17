const { successResponse, errorResponse } = require('../utils/apiResponse');
const { quotationModel, estimateModel, salesOrderModel, paymentModel, creditNoteModel, debitNoteModel } = require('../models/salesModel');

const quotationController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { status, page, limit } = req.query;
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      const result = await quotationModel.findByCompany(companyId, { status, branch_id: branchId, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Quotations fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const quote = await quotationModel.findById(req.params.id);
      if (!quote) return errorResponse(res, 404, 'Quotation not found');
      return successResponse(res, 200, 'Quotation fetched', quote);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM quotations WHERE company_id = ?', [companyId]);
      const num = `QUO-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await quotationModel.create({ ...req.body, company_id: companyId, quotation_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Quotation created', { id, quotation_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await quotationModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Quotation updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await quotationModel.delete(req.params.id);
      return successResponse(res, 200, 'Quotation deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async convertToInvoice(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const invoiceId = await quotationModel.convertToInvoice(req.params.id, companyId);
      return successResponse(res, 200, 'Converted to invoice', { invoiceId });
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const estimateController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { status, page, limit } = req.query;
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      const result = await estimateModel.findByCompany(companyId, { status, branch_id: branchId, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Estimates fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const est = await estimateModel.findById(req.params.id);
      if (!est) return errorResponse(res, 404, 'Estimate not found');
      return successResponse(res, 200, 'Estimate fetched', est);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM estimates WHERE company_id = ?', [companyId]);
      const num = `EST-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await estimateModel.create({ ...req.body, company_id: companyId, estimate_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Estimate created', { id, estimate_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await estimateModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Estimate updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await estimateModel.delete(req.params.id);
      return successResponse(res, 200, 'Estimate deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const salesOrderController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { status, page, limit } = req.query;
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      const result = await salesOrderModel.findByCompany(companyId, { status, branch_id: branchId, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Sales orders fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const so = await salesOrderModel.findById(req.params.id);
      if (!so) return errorResponse(res, 404, 'Sales order not found');
      return successResponse(res, 200, 'Sales order fetched', so);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM sales_orders WHERE company_id = ?', [companyId]);
      const num = `SO-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await salesOrderModel.create({ ...req.body, company_id: companyId, order_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Sales order created', { id, order_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await salesOrderModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Sales order updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await salesOrderModel.delete(req.params.id);
      return successResponse(res, 200, 'Sales order deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const paymentController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const { type, page, limit } = req.query;
      const payments = await paymentModel.findByCompany(companyId, { type, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Payments fetched', payments);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const payment = await paymentModel.findById(req.params.id);
      if (!payment) return errorResponse(res, 404, 'Payment not found');
      return successResponse(res, 200, 'Payment fetched', payment);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM payments WHERE company_id = ?', [companyId]);
      const num = `PAY-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await paymentModel.create({ ...req.body, company_id: companyId, payment_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Payment created', { id, payment_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await paymentModel.delete(req.params.id);
      return successResponse(res, 200, 'Payment deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const creditNoteController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const notes = await creditNoteModel.findByCompany(companyId);
      return successResponse(res, 200, 'Credit notes fetched', notes);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM credit_notes WHERE company_id = ?', [companyId]);
      const num = `CN-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await creditNoteModel.create({ ...req.body, company_id: companyId, credit_note_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Credit note created', { id, credit_note_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await creditNoteModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Credit note updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const debitNoteController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const notes = await debitNoteModel.findByCompany(companyId);
      return successResponse(res, 200, 'Debit notes fetched', notes);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id || req.body?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM debit_notes WHERE company_id = ?', [companyId]);
      const num = `DN-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;
      const id = await debitNoteModel.create({ ...req.body, company_id: companyId, debit_note_number: num, created_by: req.user?.id });
      return successResponse(res, 201, 'Debit note created', { id, debit_note_number: num });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await debitNoteModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Debit note updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};


const invoiceController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.query?.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.user?.branch_id;
      let query = `
        SELECT i.*, c.company_name as client_company_name, c.primary_contact_name as client_contact_name,
               b.name as branch_name
        FROM invoices i
        LEFT JOIN customers c ON i.client_id = c.id
        LEFT JOIN branches b ON i.branch_id = b.id
        WHERE i.company_id = ?
      `;
      const params = [companyId];
      if (branchId && branchId !== 'all') {
        query += ' AND (i.branch_id = ? OR i.branch_id IS NULL)';
        params.push(branchId);
      }
      query += ' ORDER BY i.created_at DESC';
      const [rows] = await require('../config/db').execute(query, params);
      return successResponse(res, 200, 'Invoices fetched', rows);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async getById(req, res) {
    try {
      const [rows] = await require('../config/db').execute(
        `SELECT i.*, c.company_name as client_company_name, b.name as branch_name
         FROM invoices i
         LEFT JOIN customers c ON i.client_id = c.id
         LEFT JOIN branches b ON i.branch_id = b.id
         WHERE i.id = ?`,
        [req.params.id]
      );
      if (!rows[0]) return errorResponse(res, 404, 'Invoice not found');
      return successResponse(res, 200, 'Invoice fetched', rows[0]);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id || req.body.company_id;
      if (!companyId) return errorResponse(res, 400, 'Company ID is required');
      const branchId = req.body.branch_id || req.headers['x-branch-id'] || req.user?.branch_id || null;
      const { client_id, subtotal, total_amount, due_date, notes, status, invoice_number } = req.body;

      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM invoices WHERE company_id = ?', [companyId]);
      const num = invoice_number || `INV-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;

      const [result] = await require('../config/db').execute(
        `INSERT INTO invoices (company_id, branch_id, client_id, invoice_number, subtotal, total_amount, status, due_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyId, branchId, client_id || null, num, subtotal || total_amount || 0, total_amount || subtotal || 0, status || 'unpaid', due_date || null, notes || null, req.user?.id || null]
      );

      return successResponse(res, 201, 'Invoice created successfully', { id: result.insertId, invoice_number: num });
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async update(req, res) {
    try {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(req.body)) {
        if (val !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }
      if (fields.length === 0) return successResponse(res, 200, 'No changes');
      values.push(req.params.id);
      await require('../config/db').execute(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
      return successResponse(res, 200, 'Invoice updated');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  async delete(req, res) {
    try {
      await require('../config/db').execute('DELETE FROM invoices WHERE id = ?', [req.params.id]);
      return successResponse(res, 200, 'Invoice deleted');
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = {
  invoiceController, quotationController, estimateController, salesOrderController, paymentController, creditNoteController, debitNoteController };
