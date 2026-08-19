const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create Support Ticket
const createTicket = async (req, res, next) => {
  try {
    const { customer_id, subject, description, priority } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO tickets (customer_id, subject, description, priority) VALUES (?, ?, ?, ?)',
      [customer_id, subject, description, priority || 'medium']
    );

    return successResponse(res, 201, 'Support Ticket created', { ticket_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Tickets
const getAllTickets = async (req, res, next) => {
  try {
    const [tickets] = await pool.execute(
      `SELECT t.*, c.company_name, u.full_name as agent_name 
       FROM tickets t 
       JOIN customers c ON t.customer_id = c.id 
       LEFT JOIN users u ON t.assigned_to = u.id 
       ORDER BY t.id DESC`
    );
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
      [id, req.user.id, comment]
    );

    return successResponse(res, 201, 'Comment added to ticket');
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getAllTickets, addTicketComment };