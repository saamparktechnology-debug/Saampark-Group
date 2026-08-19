const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create a Deal / Sales Opportunity
const createDeal = async (req, res, next) => {
  try {
    const { customer_id, assigned_to, title, deal_value, stage, close_date } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO deals (customer_id, assigned_to, title, deal_value, stage, close_date) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, assigned_to || req.user.id, title, deal_value, stage || 'new_lead', close_date || null]
    );

    return successResponse(res, 201, 'Deal created successfully', { deal_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Deals (Pipeline view)
const getAllDeals = async (req, res, next) => {
  try {
    const [deals] = await pool.execute(
      `SELECT d.*, c.company_name, u.full_name as owner_name 
       FROM deals d 
       JOIN customers c ON d.customer_id = c.id 
       LEFT JOIN users u ON d.assigned_to = u.id 
       ORDER BY d.id DESC`
    );
    return successResponse(res, 200, 'Deals fetched successfully', deals);
  } catch (error) {
    next(error);
  }
};

// Update Deal Stage or Value
const updateDealStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, deal_value } = req.body;

    await pool.execute(
      'UPDATE deals SET stage = COALESCE(?, stage), deal_value = COALESCE(?, deal_value) WHERE id = ?',
      [stage, deal_value, id]
    );

    return successResponse(res, 200, 'Deal updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createDeal, getAllDeals, updateDealStage };