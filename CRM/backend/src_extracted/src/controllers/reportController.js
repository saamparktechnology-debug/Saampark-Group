const pool = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

// Get CRM Dashboard Metrics
const getDashboardOverview = async (req, res, next) => {
  try {
    const [[{ total_leads }]] = await pool.execute('SELECT COUNT(*) as total_leads FROM leads');
    const [[{ total_customers }]] = await pool.execute('SELECT COUNT(*) as total_customers FROM customers');
    const [[{ deals_won }]] = await pool.execute('SELECT COUNT(*) as deals_won FROM deals WHERE stage = "won"');
    const [[{ open_tickets }]] = await pool.execute('SELECT COUNT(*) as open_tickets FROM tickets WHERE status = "open"');
    const [[{ total_revenue }]] = await pool.execute('SELECT COALESCE(SUM(deal_value), 0) as total_revenue FROM deals WHERE stage = "won"');

    return successResponse(res, 200, 'Dashboard overview data fetched', {
      total_leads,
      total_customers,
      deals_won,
      open_tickets,
      total_revenue
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardOverview };