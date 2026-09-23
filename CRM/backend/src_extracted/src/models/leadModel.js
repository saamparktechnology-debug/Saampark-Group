const pool = require('../config/db');

const createLead = async ({ source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score }) => {
  const [result] = await pool.execute(
    `INSERT INTO leads (source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [source_id || null, assigned_to || null, first_name, last_name || null, email, phone, company_name, industry, lead_score || 0]
  );
  return result.insertId;
};

const getAllLeads = async () => {
  const [rows] = await pool.execute(
    `SELECT l.*, ls.source_name, u.full_name as assigned_agent_name 
     FROM leads l 
     LEFT JOIN lead_sources ls ON l.source_id = ls.id 
     LEFT JOIN users u ON l.assigned_to = u.id 
     ORDER BY l.id DESC`
  );
  return rows;
};

const findLeadById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM leads WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateLead = async (id, { status, assigned_to, lead_score, first_name, last_name, phone, company_name }) => {
  const [result] = await pool.execute(
    `UPDATE leads SET 
      status = COALESCE(?, status), 
      assigned_to = COALESCE(?, assigned_to), 
      lead_score = COALESCE(?, lead_score),
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      company_name = COALESCE(?, company_name)
     WHERE id = ?`,
    [status, assigned_to, lead_score, first_name, last_name, phone, company_name, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createLead,
  getAllLeads,
  findLeadById,
  updateLead,
};