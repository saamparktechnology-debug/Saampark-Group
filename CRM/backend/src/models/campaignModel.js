const pool = require('../config/db');

const createCampaign = async ({ created_by, title, campaign_type, scheduled_at }) => {
  const [result] = await pool.execute(
    'INSERT INTO campaigns (created_by, title, campaign_type, scheduled_at) VALUES (?, ?, ?, ?)',
    [created_by, title, campaign_type, scheduled_at || null]
  );
  return result.insertId;
};

const getAllCampaigns = async () => {
  const [rows] = await pool.execute('SELECT * FROM campaigns ORDER BY id DESC');
  return rows;
};

const updateCampaignStatus = async (id, status) => {
  const [result] = await pool.execute('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0;
};

module.exports = {
  createCampaign,
  getAllCampaigns,
  updateCampaignStatus,
};