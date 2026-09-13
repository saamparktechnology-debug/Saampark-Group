const pool = require('../config/db');

const createTask = async ({ assigned_to, lead_id, customer_id, deal_id, title, description, due_date, priority }) => {
  const [result] = await pool.execute(
    `INSERT INTO tasks (assigned_to, lead_id, customer_id, deal_id, title, description, due_date, priority) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [assigned_to, lead_id || null, customer_id || null, deal_id || null, title, description || null, due_date, priority || 'medium']
  );
  return result.insertId;
};

const getAllTasks = async () => {
  const [rows] = await pool.execute(
    `SELECT t.*, u.full_name as assigned_to_name 
     FROM tasks t 
     LEFT JOIN users u ON t.assigned_to = u.id 
     ORDER BY t.due_date ASC`
  );
  return rows;
};

const findTaskById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateTaskStatus = async (id, status) => {
  const [result] = await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

module.exports = {
  createTask,
  getAllTasks,
  findTaskById,
  updateTaskStatus,
};