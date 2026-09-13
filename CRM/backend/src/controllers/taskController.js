const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create Task / Follow-up
const createTask = async (req, res, next) => {
  try {
    const { assigned_to, lead_id, customer_id, deal_id, title, description, due_date, priority } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO tasks (assigned_to, lead_id, customer_id, deal_id, title, description, due_date, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [assigned_to || req.user.id, lead_id || null, customer_id || null, deal_id || null, title, description || null, due_date, priority || 'medium']
    );

    return successResponse(res, 201, 'Task created successfully', { task_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Tasks
const getAllTasks = async (req, res, next) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, u.full_name as assigned_to_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       ORDER BY t.due_date ASC`
    );
    return successResponse(res, 200, 'Tasks fetched successfully', tasks);
  } catch (error) {
    next(error);
  }
};

// Update Task Status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    return successResponse(res, 200, 'Task status updated');
  } catch (error) {
    next(error);
  }
};

// Delete Task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return successResponse(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getAllTasks, updateTaskStatus, deleteTask };