const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create a new Lead
const createLead = async (req, res, next) => {
  try {
    const { source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO leads (source_id, assigned_to, first_name, last_name, email, phone, company_name, industry, lead_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [source_id || null, assigned_to || null, first_name, last_name || null, email, phone, company_name, industry, lead_score || 0]
    );

    return successResponse(res, 201, 'Lead created successfully', { lead_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

// Get all Leads
const getAllLeads = async (req, res, next) => {
  try {
    const [leads] = await pool.execute(
      `SELECT l.*, ls.source_name, u.full_name as assigned_agent_name 
       FROM leads l 
       LEFT JOIN lead_sources ls ON l.source_id = ls.id 
       LEFT JOIN users u ON l.assigned_to = u.id 
       ORDER BY l.id DESC`
    );
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

// Convert Lead to Customer (Database Transaction)
const convertLeadToCustomer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [leads] = await connection.execute('SELECT * FROM leads WHERE id = ?', [id]);
    if (leads.length === 0) {
      await connection.rollback();
      return errorResponse(res, 404, 'Lead not found.');
    }

    const lead = leads[0];

    // Insert into customers
    const [customerResult] = await connection.execute(
      'INSERT INTO customers (lead_id, company_name, primary_contact_name, email, phone, industry) VALUES (?, ?, ?, ?, ?, ?)',
      [lead.id, lead.company_name || 'N/A', `${lead.first_name} ${lead.last_name || ''}`.trim(), lead.email, lead.phone, lead.industry]
    );

    // Update lead status to 'won'
    await connection.execute('UPDATE leads SET status = "won" WHERE id = ?', [id]);

    await connection.commit();
    return successResponse(res, 200, 'Lead successfully converted to Customer', { customer_id: customerResult.insertId });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { createLead, getAllLeads, getLeadById, updateLead, convertLeadToCustomer };