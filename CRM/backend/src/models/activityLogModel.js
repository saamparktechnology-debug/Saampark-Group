const pool = require('../config/db');

const createActivityLog = async ({ user_id, action_type, details, ip_address }) => {
  const [result] = await pool.execute(
    'INSERT INTO activity_logs (user_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
    [user_id || null, action_type, details || null, ip_address || null]
  );
  return result.insertId;
};

const getActivityLogs = async (limit = 100) => {
  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name as user_name 
     FROM activity_logs a 
     LEFT JOIN users u ON a.user_id = u.id 
     ORDER BY a.id DESC LIMIT ?`,
    [limit]
  );
  return rows;
};

module.exports = {
  createActivityLog,
  getActivityLogs,
};