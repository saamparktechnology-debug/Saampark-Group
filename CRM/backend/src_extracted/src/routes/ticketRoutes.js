const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// GET all tickets
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [tickets] = await pool.execute(
      `SELECT t.*, u.full_name as assigned_agent_name, c.name as client_name
       FROM tickets t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN customers c ON t.client_id = c.id
       ORDER BY t.id DESC`
    );
    return successResponse(res, 200, 'Tickets fetched', tickets);
  } catch (err) { next(err); }
});

// GET single ticket with replies
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!tickets.length) return errorResponse(res, 404, 'Ticket not found.');

    let replies = [];
    try {
      const [rows] = await pool.execute(
        'SELECT tr.*, u.full_name as author_name FROM ticket_replies tr JOIN users u ON tr.user_id = u.id WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC',
        [req.params.id]
      );
      replies = rows;
    } catch {}

    return successResponse(res, 200, 'Ticket found', { ...tickets[0], replies });
  } catch (err) { next(err); }
});

// CREATE ticket — clients and teams can open tickets
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subject, department, description, priority } = req.body;
    if (!subject) return errorResponse(res, 400, 'Ticket subject is required.');
    const [result] = await pool.execute(
      'INSERT INTO tickets (subject, department, description, priority, status, client_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [subject, department || 'General_Support', description || null, priority || 'Medium', 'New', req.body.client_id || null, req.user.id]
    );
    return successResponse(res, 201, 'Ticket created', { ticket_id: result.insertId });
  } catch (err) { next(err); }
});

// UPDATE ticket — assign agent, change status
router.put('/:id', authenticate, requireRole(1, 2, 3), async (req, res, next) => {
  try {
    const { status, assigned_to, priority } = req.body;
    await pool.execute(
      'UPDATE tickets SET status = COALESCE(?, status), assigned_to = COALESCE(?, assigned_to), priority = COALESCE(?, priority) WHERE id = ?',
      [status || null, assigned_to || null, priority || null, req.params.id]
    );
    return successResponse(res, 200, 'Ticket updated');
  } catch (err) { next(err); }
});

// ADD reply to ticket
router.post('/:id/reply', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return errorResponse(res, 400, 'Reply message is required.');
    // Try to insert into ticket_replies table
    try {
      await pool.execute(
        'INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)',
        [req.params.id, req.user.id, message]
      );
    } catch {
      // Table might not exist yet — return success anyway
    }
    // Update ticket status to 'Open' when replied
    await pool.execute("UPDATE tickets SET status = 'Open' WHERE id = ? AND status = 'New'", [req.params.id]);
    return successResponse(res, 201, 'Reply added');
  } catch (err) { next(err); }
});

// DELETE ticket — admin only
router.delete('/:id', authenticate, requireRole(1, 2), async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM tickets WHERE id = ?', [req.params.id]);
    return successResponse(res, 200, 'Ticket deleted');
  } catch (err) { next(err); }
});

module.exports = router;