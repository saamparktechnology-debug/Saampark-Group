const pool = require('../config/db');

const createTicket = async ({ customer_id, subject, description, priority }) => {
  const [result] = await pool.execute(
    'INSERT INTO tickets (customer_id, subject, description, priority) VALUES (?, ?, ?, ?)',
    [customer_id, subject, description, priority || 'medium']
  );
  return result.insertId;
};

const getAllTickets = async () => {
  const [rows] = await pool.execute(
    `SELECT t.*, c.company_name, u.full_name as agent_name 
     FROM tickets t 
     JOIN customers c ON t.customer_id = c.id 
     LEFT JOIN users u ON t.assigned_to = u.id 
     ORDER BY t.id DESC`
  );
  return rows;
};

const findTicketById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateTicketStatus = async (id, status) => {
  const [result] = await pool.execute('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

const addTicketComment = async (ticket_id, user_id, comment) => {
  const [result] = await pool.execute(
    'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
    [ticket_id, user_id, comment]
  );
  return result.insertId;
};

module.exports = {
  createTicket,
  getAllTickets,
  findTicketById,
  updateTicketStatus,
  addTicketComment,
};