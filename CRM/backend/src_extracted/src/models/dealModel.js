const pool = require('../config/db');

const createDeal = async ({ customer_id, assigned_to, title, deal_value, stage, close_date }) => {
  const [result] = await pool.execute(
    'INSERT INTO deals (customer_id, assigned_to, title, deal_value, stage, close_date) VALUES (?, ?, ?, ?, ?, ?)',
    [customer_id, assigned_to || null, title, deal_value, stage || 'new_lead', close_date || null]
  );
  return result.insertId;
};

const getAllDeals = async () => {
  const [rows] = await pool.execute(
    `SELECT d.*, c.company_name, u.full_name as owner_name 
     FROM deals d 
     JOIN customers c ON d.customer_id = c.id 
     LEFT JOIN users u ON d.assigned_to = u.id 
     ORDER BY d.id DESC`
  );
  return rows;
};

const findDealById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM deals WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateDealStage = async (id, stage, deal_value) => {
  const [result] = await pool.execute(
    'UPDATE deals SET stage = COALESCE(?, stage), deal_value = COALESCE(?, deal_value) WHERE id = ?',
    [stage, deal_value, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createDeal,
  getAllDeals,
  findDealById,
  updateDealStage,
};