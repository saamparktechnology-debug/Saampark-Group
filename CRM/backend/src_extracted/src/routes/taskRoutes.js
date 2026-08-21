const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// GET all tasks (scoped by company via JWT later)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, u.full_name as assigned_to_name, p.title as project_title
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.id DESC`
    );
    return successResponse(res, 200, 'Tasks fetched', tasks);
  } catch (err) { next(err); }
});

// GET tasks assigned to me
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, p.title as project_title
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
       ORDER BY t.priority DESC, t.deadline ASC`,
      [req.user.id]
    );
    return successResponse(res, 200, 'My tasks fetched', tasks);
  } catch (err) { next(err); }
});

// GET single task
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) return errorResponse(res, 404, 'Task not found.');
    return successResponse(res, 200, 'Task found', tasks[0]);
  } catch (err) { next(err); }
});

// CREATE task
router.post('/', authenticate, requireRole(1, 2, 3), async (req, res, next) => {
  try {
    const { title, project_id, assigned_to, status, priority, start_date, deadline, description } = req.body;
    if (!title) return errorResponse(res, 400, 'Task title is required.');
    const [result] = await pool.execute(
      'INSERT INTO tasks (title, project_id, assigned_to, status, priority, start_date, deadline, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, project_id || null, assigned_to || null, status || 'To_do', priority || 'Medium', start_date || null, deadline || null, description || null, req.user.id]
    );
    return successResponse(res, 201, 'Task created', { task_id: result.insertId });
  } catch (err) { next(err); }
});

// UPDATE task
router.put('/:id', authenticate, requireRole(1, 2, 3), async (req, res, next) => {
  try {
    const { title, status, priority, assigned_to, start_date, deadline, description } = req.body;
    await pool.execute(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        start_date = COALESCE(?, start_date),
        deadline = COALESCE(?, deadline),
        description = COALESCE(?, description)
       WHERE id = ?`,
      [title || null, status || null, priority || null, assigned_to || null, start_date || null, deadline || null, description || null, req.params.id]
    );
    return successResponse(res, 200, 'Task updated');
  } catch (err) { next(err); }
});

// PATCH task status only (used by the frontend Kanban drag-and-drop:
// api.patch(`/tasks/${id}/status`, { status }) — this route was missing and 404'd)
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return errorResponse(res, 400, 'Status is required.');
    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    return successResponse(res, 200, 'Task status updated');
  } catch (err) { next(err); }
});

// DELETE task
router.delete('/:id', authenticate, requireRole(1, 2), async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    return successResponse(res, 200, 'Task deleted');
  } catch (err) { next(err); }
});

module.exports = router;