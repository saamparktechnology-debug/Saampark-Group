const { successResponse, errorResponse } = require('../utils/apiResponse');
const { employeeModel, attendanceModel, leaveModel, payrollModel, performanceModel, employeeDocumentModel } = require('../models/hrModel');

const employeeController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { search, department_id, status, page, limit } = req.query;
      const result = await employeeModel.findByCompany(companyId, { search, department_id, status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Employees fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const emp = await employeeModel.findById(req.params.id);
      if (!emp) return errorResponse(res, 404, 'Employee not found');
      return successResponse(res, 200, 'Employee fetched', emp);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const [count] = await require('../config/db').execute('SELECT COUNT(*) as cnt FROM employees WHERE company_id = ?', [companyId]);
      const code = `EMP-${String(count[0].cnt + 1).padStart(4, '0')}`;
      const id = await employeeModel.create({ ...req.body, company_id: companyId, employee_code: code });
      return successResponse(res, 201, 'Employee created', { id, employee_code: code });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await employeeModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Employee updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await employeeModel.delete(req.params.id);
      return successResponse(res, 200, 'Employee deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const attendanceController = {
  async clockIn(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await attendanceModel.clockIn(companyId, req.body.employee_id, req.body.note);
      return successResponse(res, 200, 'Clocked in', { id });
    } catch (err) { return errorResponse(res, 400, err.message); }
  },
  async clockOut(req, res) {
    try {
      const id = await attendanceModel.clockOut(req.body.employee_id);
      return successResponse(res, 200, 'Clocked out', { id });
    } catch (err) { return errorResponse(res, 400, err.message); }
  },
  async getStatus(req, res) {
    try {
      const status = await attendanceModel.getStatus(req.query.employee_id);
      return successResponse(res, 200, 'Status fetched', status);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getByEmployee(req, res) {
    try {
      const { from_date, to_date, page, limit } = req.query;
      const records = await attendanceModel.findByEmployee(req.params.employeeId, { from_date, to_date, page: parseInt(page) || 1, limit: parseInt(limit) || 30 });
      return successResponse(res, 200, 'Attendance fetched', records);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getByCompany(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { date, department_id, page, limit } = req.query;
      const records = await attendanceModel.findByCompany(companyId, { date, department_id, page: parseInt(page) || 1, limit: parseInt(limit) || 100 });
      return successResponse(res, 200, 'Attendance fetched', records);
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const leaveController = {
  async getTypes(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const types = await leaveModel.getLeaveTypes(companyId);
      return successResponse(res, 200, 'Leave types fetched', types);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async createType(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await leaveModel.createLeaveType({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Leave type created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async requestLeave(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await leaveModel.requestLeave({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Leave requested', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getRequests(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { employee_id, status, page, limit } = req.query;
      const requests = await leaveModel.getLeaveRequests(companyId, { employee_id, status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Leave requests fetched', requests);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async approve(req, res) {
    try {
      await leaveModel.approveLeave(req.params.id, req.user?.id);
      return successResponse(res, 200, 'Leave approved');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async reject(req, res) {
    try {
      await leaveModel.rejectLeave(req.params.id, req.user?.id);
      return successResponse(res, 200, 'Leave rejected');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const payrollController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { month, year, employee_id, page, limit } = req.query;
      const payroll = await payrollModel.findByCompany(companyId, { month: parseInt(month), year: parseInt(year), employee_id, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Payroll fetched', payroll);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await payrollModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Payroll created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async markPaid(req, res) {
    try {
      await payrollModel.markPaid(req.params.id);
      return successResponse(res, 200, 'Payroll marked as paid');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const performanceController = {
  async getByEmployee(req, res) {
    try {
      const reviews = await performanceModel.findByEmployee(req.params.employeeId);
      return successResponse(res, 200, 'Reviews fetched', reviews);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await performanceModel.create({ ...req.body, company_id: companyId, reviewer_id: req.user?.id });
      return successResponse(res, 201, 'Review created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await performanceModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Review updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const employeeDocController = {
  async getByEmployee(req, res) {
    try {
      const docs = await employeeDocumentModel.findByEmployee(req.params.employeeId);
      return successResponse(res, 200, 'Documents fetched', docs);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await employeeDocumentModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Document uploaded', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await employeeDocumentModel.delete(req.params.id);
      return successResponse(res, 200, 'Document deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { employeeController, attendanceController, leaveController, payrollController, performanceController, employeeDocController };
