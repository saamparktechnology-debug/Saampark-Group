const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create Customer directly
const createCustomer = async (req, res, next) => {
  try {
    const { company_name, primary_contact_name, email, phone, industry, company_id, companyId, branch_id, branchId, sub_branch_id, subBranchId } = req.body;
    const targetComp = req.companyId || company_id || companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || 1;
    const targetBranch = branch_id || branchId || (req.headers['x-branch-id'] ? parseInt(req.headers['x-branch-id'], 10) : null);
    const targetSubBranch = sub_branch_id || subBranchId || (req.headers['x-sub-branch-id'] ? parseInt(req.headers['x-sub-branch-id'], 10) : null);

    const [result] = await pool.execute(
      'INSERT INTO customers (company_name, primary_contact_name, email, phone, industry, company_id, branch_id, sub_branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [company_name, primary_contact_name, email, phone, industry || null, targetComp, targetBranch || null, targetSubBranch || null]
    );

    return successResponse(res, 201, 'Customer created successfully', { customer_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Customers
const getAllCustomers = async (req, res, next) => {
  try {
    const compId = req.companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || req.query.company_id || req.query.companyId;
    const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.query.branchId;
    const subBranchId = req.headers['x-sub-branch-id'] || req.query.sub_branch_id;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (compId && compId !== 'all') {
      query += ' AND (company_id = ? OR company_id IS NULL)';
      params.push(compId);
    }
    if (branchId && branchId !== 'all') {
      query += ' AND (branch_id = ? OR branch_id IS NULL)';
      params.push(branchId);
    }
    if (subBranchId && subBranchId !== 'all') {
      query += ' AND (sub_branch_id = ? OR sub_branch_id IS NULL)';
      params.push(subBranchId);
    }

    query += ' ORDER BY id DESC';
    const [customers] = await pool.execute(query, params);
    return successResponse(res, 200, 'Customers fetched successfully', customers);
  } catch (error) {
    next(error);
  }
};

// Get Customer Details
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [customers] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);

    if (customers.length === 0) {
      return errorResponse(res, 404, 'Customer not found.');
    }

    return successResponse(res, 200, 'Customer details fetched', customers[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { createCustomer, getAllCustomers, getCustomerById };
