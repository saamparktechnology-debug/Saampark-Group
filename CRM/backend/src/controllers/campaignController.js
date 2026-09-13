const pool = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

// Create Marketing Campaign
const createCampaign = async (req, res, next) => {
  try {
    const { title, campaign_type, scheduled_at } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO campaigns (created_by, title, campaign_type, scheduled_at) VALUES (?, ?, ?, ?)',
      [req.user.id, title, campaign_type, scheduled_at || null]
    );

    return successResponse(res, 201, 'Marketing Campaign created', { campaign_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Campaigns
const getAllCampaigns = async (req, res, next) => {
  try {
    const [campaigns] = await pool.execute('SELECT * FROM campaigns ORDER BY id DESC');
    return successResponse(res, 200, 'Campaigns fetched', campaigns);
  } catch (error) {
    next(error);
  }
};

module.exports = { createCampaign, getAllCampaigns };