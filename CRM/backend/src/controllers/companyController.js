const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── GET ALL COMPANIES ─────────────────────────────────────────────────────────
const getAllCompanies = async (req, res, next) => {
  try {
    let query = `SELECT c.*, COUNT(DISTINCT u.id) as member_count
                 FROM companies c
                 LEFT JOIN users u ON u.company_id = c.id AND u.deleted_at IS NULL
                 GROUP BY c.id ORDER BY c.created_at DESC`;
    const [companies] = await pool.execute(query);
    return successResponse(res, 200, 'Companies fetched', companies);
  } catch (error) { next(error); }
};

// ─── GET SINGLE COMPANY ────────────────────────────────────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const [companies] = await pool.execute('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (!companies.length) return errorResponse(res, 404, 'Company not found.');
    return successResponse(res, 200, 'Company found', companies[0]);
  } catch (error) { next(error); }
};

// ─── CREATE COMPANY ────────────────────────────────────────────────────────────
const createCompany = async (req, res, next) => {
  try {
    if (req.user.role_id !== 1 && req.user.role !== 'Super Admin') {
      return errorResponse(res, 403, 'Access denied: Only Super Admin can create companies.');
    }
    const { name, slug, currency, currency_symbol, logo_url, address, industry } = req.body;
    if (!name) return errorResponse(res, 400, 'Company name is required.');

    const companySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check slug unique
    const [existing] = await pool.execute('SELECT id FROM companies WHERE slug = ?', [companySlug]);
    if (existing.length) return errorResponse(res, 400, 'A company with this name/slug already exists.');

    const [result] = await pool.execute(
      'INSERT INTO companies (name, slug, currency, currency_symbol, logo_url, address, industry, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, companySlug, currency || 'INR', currency_symbol || '₹', logo_url || null, address || null, industry || null, req.user.id]
    );

    return successResponse(res, 201, 'Company created successfully', { company_id: result.insertId, slug: companySlug });
  } catch (error) { next(error); }
};

// ─── UPDATE COMPANY ────────────────────────────────────────────────────────────
const updateCompany = async (req, res, next) => {
  try {
    if (req.user.role_id !== 1 && req.user.role !== 'Super Admin') {
      return errorResponse(res, 403, 'Access denied: Only Super Admin can update companies.');
    }
    const { name, currency, currency_symbol, logo_url, address, industry } = req.body;
    await pool.execute(
      `UPDATE companies SET
        name = COALESCE(?, name),
        currency = COALESCE(?, currency),
        currency_symbol = COALESCE(?, currency_symbol),
        logo_url = COALESCE(?, logo_url),
        address = COALESCE(?, address),
        industry = COALESCE(?, industry),
        updated_at = NOW()
       WHERE id = ?`,
      [name || null, currency || null, currency_symbol || null, logo_url || null, address || null, industry || null, req.params.id]
    );
    return successResponse(res, 200, 'Company updated');
  } catch (error) { next(error); }
};

// ─── DELETE COMPANY (Super Admin Only) ────────────────────────────────────────
const deleteCompany = async (req, res, next) => {
  try {
    if (req.user.role_id !== 1 && req.user.role !== 'Super Admin') {
      return errorResponse(res, 403, 'Access denied: Only Super Admin can delete companies.');
    }
    const { id } = req.params;

    const [comp] = await pool.execute('SELECT id, slug FROM companies WHERE id = ? OR slug = ?', [id, id]);
    if (!comp.length) return errorResponse(res, 404, 'Company not found.');
    if (comp[0].id === 1 || comp[0].slug === 'tech') {
      return errorResponse(res, 400, 'Cannot delete the primary default company.');
    }

    const compId = comp[0].id;
    const compSlug = comp[0].slug;

    // Delete company record from database (cascades to all foreign key linked child tables)
    await pool.execute('DELETE FROM companies WHERE id = ?', [compId]);

    // Also clean up any unlinked tables or app_data store documents
    await pool.execute('DELETE FROM customers WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM leads WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM deals WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM expenses WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM tickets WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM app_data WHERE module_key LIKE ? OR module_key LIKE ?', [`%_${compId}`, `%_${compSlug}`]).catch(() => {});

    // Invalidate company scope cache
    try {
      const { invalidateCompanyCache } = require('../middlewares/companyScopeMiddleware');
      if (typeof invalidateCompanyCache === 'function') invalidateCompanyCache();
    } catch {}

    return successResponse(res, 200, 'Company and all associated branches, invoices, and data deleted permanently');
  } catch (error) { next(error); }
};

// ─── GET COMPANY MEMBERS ───────────────────────────────────────────────────────
const getCompanyMembers = async (req, res, next) => {
  try {
    const [members] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.last_login, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.company_id = ? AND u.deleted_at IS NULL
       ORDER BY u.role_id ASC, u.full_name ASC`,
      [req.params.id]
    );
    return successResponse(res, 200, 'Company members fetched', members);
  } catch (error) { next(error); }
};

module.exports = { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany, getCompanyMembers };
