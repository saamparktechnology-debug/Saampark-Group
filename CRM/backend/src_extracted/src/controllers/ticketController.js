const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create Support Ticket
const createTicket = async (req, res, next) => {
  try {
    const { customer_id, subject, description, priority, company_id, companyId, branch_id, branchId } = req.body;
    const compId = req.companyId || company_id || companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || 1;
    const bId = branch_id || branchId || (req.headers['x-branch-id'] ? parseInt(req.headers['x-branch-id'], 10) : null);

    const [result] = await pool.execute(
      'INSERT INTO tickets (customer_id, subject, description, priority, company_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, subject, description, priority || 'medium', compId, bId || null]
    );

    return successResponse(res, 201, 'Support Ticket created', { ticket_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Tickets
const getAllTickets = async (req, res, next) => {
  try {
    const compId = req.companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || req.query.company_id;
    const branchId = req.headers['x-branch-id'] || req.query.branch_id;

    let query = `
      SELECT t.*, c.company_name, u.full_name as agent_name 
      FROM tickets t 
      LEFT JOIN customers c ON t.customer_id = c.id 
      LEFT JOIN users u ON t.assigned_to = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (compId && compId !== 'all') {
      query += ' AND (t.company_id = ? OR t.company_id IS NULL)';
      params.push(compId);
    }
    if (branchId && branchId !== 'all') {
      query += ' AND (t.branch_id = ? OR t.branch_id IS NULL)';
      params.push(branchId);
    }
    query += ' ORDER BY t.id DESC';
    const [tickets] = await pool.execute(query, params);
    return successResponse(res, 200, 'Tickets fetched successfully', tickets);
  } catch (error) {
    next(error);
  }
};

// Add Comment / Resolution note to Ticket
const addTicketComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    await pool.execute(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [id, req.user?.id || 1, comment]
    );

    return successResponse(res, 201, 'Comment added to ticket');
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getAllTickets, addTicketComment };
