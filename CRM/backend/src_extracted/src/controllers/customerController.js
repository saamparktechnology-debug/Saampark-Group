const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create Customer directly
const createCustomer = async (req, res, next) => {
  try {
    const { company_name, primary_contact_name, email, phone, industry } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO customers (company_name, primary_contact_name, email, phone, industry) VALUES (?, ?, ?, ?, ?)',
      [company_name, primary_contact_name, email, phone, industry || null]
    );

    return successResponse(res, 201, 'Customer created successfully', { customer_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Customers
const getAllCustomers = async (req, res, next) => {
  try {
    const [customers] = await pool.execute('SELECT * FROM customers ORDER BY id DESC');
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