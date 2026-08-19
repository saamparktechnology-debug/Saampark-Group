const pool = require('../config/db');

// Get all available packages
const getAllPackages = async () => {
  const [rows] = await pool.execute('SELECT * FROM subscription_packages WHERE status = "active" ORDER BY price_per_month ASC');
  return rows;
};

// Create a new customer subscription
const createSubscription = async ({ customer_id, package_id, start_date, end_date, billing_cycle }) => {
  const [result] = await pool.execute(
    `INSERT INTO customer_subscriptions (customer_id, package_id, start_date, end_date, billing_cycle, status) 
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [customer_id, package_id, start_date, end_date, billing_cycle || 'monthly']
  );
  return result.insertId;
};

// Get all customer subscriptions with customer and package details
const getAllSubscriptions = async () => {
  const [rows] = await pool.execute(
    `SELECT cs.*, c.company_name, c.primary_contact_name, c.email, sp.name as package_name, sp.package_code, sp.price_per_month 
     FROM customer_subscriptions cs 
     JOIN customers c ON cs.customer_id = c.id 
     JOIN subscription_packages sp ON cs.package_id = sp.id 
     ORDER BY cs.id DESC`
  );
  return rows;
};

// Get active subscription by Customer ID
const getSubscriptionByCustomerId = async (customer_id) => {
  const [rows] = await pool.execute(
    `SELECT cs.*, sp.name as package_name, sp.price_per_month, sp.features 
     FROM customer_subscriptions cs 
     JOIN subscription_packages sp ON cs.package_id = sp.id 
     WHERE cs.customer_id = ? AND cs.status = 'active'`,
    [customer_id]
  );
  return rows[0] || null;
};

// Update Subscription Status (Renew / Cancel / Expire)
const updateSubscriptionStatus = async (id, status) => {
  const [result] = await pool.execute(
    'UPDATE customer_subscriptions SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows > 0;
};

// Record Subscription Invoice / Payment
const createInvoice = async ({ subscription_id, invoice_number, amount, payment_method }) => {
  const [result] = await pool.execute(
    `INSERT INTO subscription_invoices (subscription_id, invoice_number, amount, payment_status, payment_method, paid_at) 
     VALUES (?, ?, ?, 'paid', ?, NOW())`,
    [subscription_id, invoice_number, amount, payment_method || 'upi']
  );
  return result.insertId;
};

module.exports = {
  getAllPackages,
  createSubscription,
  getAllSubscriptions,
  getSubscriptionByCustomerId,
  updateSubscriptionStatus,
  createInvoice,
};