const pool = require('../config/db');

const createCustomer = async ({ lead_id, company_name, primary_contact_name, email, phone, industry }) => {
  const [result] = await pool.execute(
    'INSERT INTO customers (lead_id, company_name, primary_contact_name, email, phone, industry) VALUES (?, ?, ?, ?, ?, ?)',
    [lead_id || null, company_name, primary_contact_name, email, phone, industry || null]
  );
  return result.insertId;
};

const getAllCustomers = async () => {
  const [rows] = await pool.execute('SELECT * FROM customers ORDER BY id DESC');
  return rows;
};

const findCustomerById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateCustomer = async (id, { company_name, primary_contact_name, email, phone, status }) => {
  const [result] = await pool.execute(
    `UPDATE customers SET 
      company_name = COALESCE(?, company_name),
      primary_contact_name = COALESCE(?, primary_contact_name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      status = COALESCE(?, status)
     WHERE id = ?`,
    [company_name, primary_contact_name, email, phone, status, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createCustomer,
  getAllCustomers,
  findCustomerById,
  updateCustomer,
};