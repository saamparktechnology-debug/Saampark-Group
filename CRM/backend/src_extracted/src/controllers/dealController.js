const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create a Deal / Sales Opportunity
const createDeal = async (req, res, next) => {
  try {
    const { customer_id, assigned_to, title, deal_value, stage, close_date, company_id, companyId, branch_id, branchId, sub_branch_id, subBranchId } = req.body;
    const targetComp = req.companyId || company_id || companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || 1;
    const targetBranch = branch_id || branchId || (req.headers['x-branch-id'] ? parseInt(req.headers['x-branch-id'], 10) : null);
    const targetSubBranch = sub_branch_id || subBranchId || (req.headers['x-sub-branch-id'] ? parseInt(req.headers['x-sub-branch-id'], 10) : null);

    const [result] = await pool.execute(
      'INSERT INTO deals (customer_id, assigned_to, title, deal_value, stage, close_date, company_id, branch_id, sub_branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, assigned_to || req.user?.id || 1, title, deal_value, stage || 'new_lead', close_date || null, targetComp, targetBranch || null, targetSubBranch || null]
    );

    return successResponse(res, 201, 'Deal created successfully', { deal_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get All Deals (Pipeline view)
const getAllDeals = async (req, res, next) => {
  try {
    const compId = req.companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || req.query.company_id || req.query.companyId;
    const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.query.branchId;
    const subBranchId = req.headers['x-sub-branch-id'] || req.query.sub_branch_id;

    let query = `
      SELECT d.*, c.company_name, u.full_name as owner_name 
      FROM deals d 
      JOIN customers c ON d.customer_id = c.id 
      LEFT JOIN users u ON d.assigned_to = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (compId && compId !== 'all') {
      query += ' AND (d.company_id = ? OR d.company_id IS NULL)';
      params.push(compId);
    }
    if (branchId && branchId !== 'all') {
      query += ' AND (d.branch_id = ? OR d.branch_id IS NULL)';
      params.push(branchId);
    }
    if (subBranchId && subBranchId !== 'all') {
      query += ' AND (d.sub_branch_id = ? OR d.sub_branch_id IS NULL)';
      params.push(subBranchId);
    }

    query += ' ORDER BY d.id DESC';
    const [deals] = await pool.execute(query, params);
    return successResponse(res, 200, 'Deals fetched successfully', deals);
  } catch (error) {
    next(error);
  }
};

// Update Deal Stage or Value
const updateDealStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, deal_value } = req.body;

    await pool.execute(
      'UPDATE deals SET stage = COALESCE(?, stage), deal_value = COALESCE(?, deal_value) WHERE id = ?',
      [stage, deal_value, id]
    );

    return successResponse(res, 200, 'Deal updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createDeal, getAllDeals, updateDealStage };
