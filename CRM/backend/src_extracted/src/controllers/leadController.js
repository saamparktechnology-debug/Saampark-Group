const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create a new Lead
const createLead = async (req, res, next) => {
  try {
    const { source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score, company_id, companyId, branch_id, branchId, sub_branch_id, subBranchId } = req.body;
    const targetComp = req.companyId || company_id || companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || 1;
    const targetBranch = branch_id || branchId || (req.headers['x-branch-id'] ? parseInt(req.headers['x-branch-id'], 10) : null);
    const targetSubBranch = sub_branch_id || subBranchId || (req.headers['x-sub-branch-id'] ? parseInt(req.headers['x-sub-branch-id'], 10) : null);

    const [result] = await pool.execute(
      `INSERT INTO leads (source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score, company_id, branch_id, sub_branch_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [source_id || null, assigned_to || null, first_name, last_name || null, email, phone, company_name, industry, lead_score || 0, targetComp, targetBranch || null, targetSubBranch || null]
    );

    return successResponse(res, 201, 'Lead created successfully', { lead_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get all Leads
const getAllLeads = async (req, res, next) => {
  try {
    const compId = req.companyId || (req.headers['x-company-id'] ? parseInt(req.headers['x-company-id'], 10) : null) || req.query.company_id || req.query.companyId;
    const branchId = req.headers['x-branch-id'] || req.query.branch_id || req.query.branchId;
    const subBranchId = req.headers['x-sub-branch-id'] || req.query.sub_branch_id;

    let query = `
      SELECT l.*, ls.source_name, u.full_name as assigned_agent_name 
      FROM leads l 
      LEFT JOIN lead_sources ls ON l.source_id = ls.id 
      LEFT JOIN users u ON l.assigned_to = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (compId && compId !== 'all') {
      query += ' AND (l.company_id = ? OR l.company_id IS NULL)';
      params.push(compId);
    }
    if (branchId && branchId !== 'all') {
      query += ' AND (l.branch_id = ? OR l.branch_id IS NULL)';
      params.push(branchId);
    }
    if (subBranchId && subBranchId !== 'all') {
      query += ' AND (l.sub_branch_id = ? OR l.sub_branch_id IS NULL)';
      params.push(subBranchId);
    }

    query += ' ORDER BY l.id DESC';
    const [leads] = await pool.execute(query, params);
    return successResponse(res, 200, 'Leads fetched successfully', leads);
  } catch (error) {
    next(error);
  }
};

// Get Lead by ID
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [leads] = await pool.execute('SELECT * FROM leads WHERE id = ?', [id]);

    if (leads.length === 0) {
      return errorResponse(res, 404, 'Lead not found.');
    }

    return successResponse(res, 200, 'Lead details fetched', leads[0]);
  } catch (error) {
    next(error);
  }
};

// Update Lead Status / Info
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, lead_score, first_name, last_name, phone, company_name } = req.body;

    await pool.execute(
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

    return successResponse(res, 200, 'Lead updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete Lead
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM leads WHERE id = ?', [id]);
    return successResponse(res, 200, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
};


// Convert Lead to Customer
const convertLeadToCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [leads] = await pool.execute('SELECT * FROM leads WHERE id = ?', [id]);
    if (leads.length === 0) return errorResponse(res, 404, 'Lead not found.');

    const lead = leads[0];
    const customerName = lead.company_name || `${lead.first_name} ${lead.last_name || ''}`.trim();

    const [custResult] = await pool.execute(
      'INSERT INTO customers (company_name, primary_contact_name, email, phone, industry, company_id, branch_id, sub_branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerName, `${lead.first_name} ${lead.last_name || ''}`.trim(), lead.email, lead.phone, lead.industry, lead.company_id || 1, lead.branch_id || null, lead.sub_branch_id || null]
    );

    await pool.execute('UPDATE leads SET status = "converted" WHERE id = ?', [id]);

    return successResponse(res, 200, 'Lead converted to customer successfully', { customer_id: custResult.insertId });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLead, getAllLeads, getLeadById, updateLead, deleteLead, convertLeadToCustomer };
