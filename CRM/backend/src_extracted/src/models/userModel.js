const pool = require('../config/db');

const createUser = async ({ role_id, full_name, email, password_hash, phone }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (role_id, full_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
    [role_id || 3, full_name, email, password_hash, phone || null]
  );
  return result.insertId;
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
    [email]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT u.id, u.full_name, u.email, u.phone, u.status, u.role_id, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
    [id]
  );
  return rows[0] || null;
};

const getAllUsers = async () => {
  const [rows] = await pool.execute(
    'SELECT u.id, u.full_name, u.email, u.phone, u.status, r.name as role_name, u.created_at FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id DESC'
  );
  return rows;
};

const updateUser = async (id, { full_name, phone, role_id, status }) => {
  const [result] = await pool.execute(
    'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), role_id = COALESCE(?, role_id), status = COALESCE(?, status) WHERE id = ?',
    [full_name, phone, role_id, status, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUser,
};