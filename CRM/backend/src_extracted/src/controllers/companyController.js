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
    const { 
      name, slug, currency, currency_symbol, logo_url, address, industry,
      brand_name, division_name, subtitle, gstin, pan, cin, msme_reg, website,
      signatory_name, signatory_designation, signature_image_url, stamp_image_url,
      terms_conditions, invoice_notes, upi_id, account_holder, bank_name, account_number, ifsc_code, bank_branch, payment_qr_url,
      gst_bank_name, gst_account_holder, gst_account_number, gst_ifsc_code, gst_bank_branch, gst_upi_id, gst_payment_qr_url,
      nongst_bank_name, nongst_account_holder, nongst_account_number, nongst_ifsc_code, nongst_bank_branch, nongst_upi_id, nongst_payment_qr_url
    } = req.body;
    if (!name) return errorResponse(res, 400, 'Company name is required.');

    const companySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check slug unique
    const [existing] = await pool.execute('SELECT id FROM companies WHERE slug = ?', [companySlug]);
    if (existing.length) return errorResponse(res, 400, 'A company with this name/slug already exists.');

    const [result] = await pool.execute(
      `INSERT INTO companies (
        name, slug, currency, currency_symbol, logo_url, address, industry, created_by,
        brand_name, division_name, subtitle, gstin, pan, cin, msme_reg, website,
        signatory_name, signatory_designation, signature_image_url, stamp_image_url,
        terms_conditions, invoice_notes, upi_id, account_holder, bank_name, account_number, ifsc_code, bank_branch, payment_qr_url,
        gst_bank_name, gst_account_holder, gst_account_number, gst_ifsc_code, gst_bank_branch, gst_upi_id, gst_payment_qr_url,
        nongst_bank_name, nongst_account_holder, nongst_account_number, nongst_ifsc_code, nongst_bank_branch, nongst_upi_id, nongst_payment_qr_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, companySlug, currency || 'INR', currency_symbol || '₹', logo_url || null, address || null, industry || null, req.user.id,
        brand_name || null, division_name || null, subtitle || null, gstin || null, pan || null, cin || null, msme_reg || null, website || null,
        signatory_name || null, signatory_designation || null, signature_image_url || null, stamp_image_url || null,
        terms_conditions || null, invoice_notes || null, upi_id || null, account_holder || null, bank_name || null, account_number || null, ifsc_code || null, bank_branch || null, payment_qr_url || null,
        gst_bank_name || null, gst_account_holder || null, gst_account_number || null, gst_ifsc_code || null, gst_bank_branch || null, gst_upi_id || null, gst_payment_qr_url || null,
        nongst_bank_name || null, nongst_account_holder || null, nongst_account_number || null, nongst_ifsc_code || null, nongst_bank_branch || null, nongst_upi_id || null, nongst_payment_qr_url || null
      ]
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
    
    const allowedFields = [
      'name', 'currency', 'currency_symbol', 'logo_url', 'address', 'industry',
      'brand_name', 'division_name', 'subtitle', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
      'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
      'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
      'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
      'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url'
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(req.body[field] === '' ? null : req.body[field]);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return successResponse(res, 200, 'Company updated');
  } catch (error) { next(error); }
};

// ─── DELETE COMPANY (Super Admin Only) ────────────────────────────────────────
const deleteCompany = async (req, res, next) => {
  try {
    const userRoleId = Number(req.user?.role_id);
    const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
    if (userRoleId !== 1 && !userRole.includes('super')) {
      return errorResponse(res, 403, 'Access denied: Only Super Admin can delete companies.');
    }
    const { id } = req.params;

    const [comp] = await pool.execute('SELECT id, slug FROM companies WHERE id = ? OR slug = ?', [id, id]);
    if (!comp.length) return errorResponse(res, 404, 'Company not found.');
    if (String(comp[0].id) === '1' || comp[0].slug === 'tech') {
      return errorResponse(res, 400, 'Cannot delete the primary default company.');
    }

    const compId = comp[0].id;
    const compSlug = comp[0].slug;

    // Track deleted company in tombstone table so all users belonging to it can be blocked
    await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "companies")', [String(compId)]).catch(() => {});
    await pool.execute('INSERT IGNORE INTO deleted_items (item_id, module_name) VALUES (?, "companies")', [compSlug]).catch(() => {});

    // Mark company users as inactive before unlinking
    await pool.execute('UPDATE users SET status = "inactive", updated_at = NOW() WHERE company_id = ?', [compId]).catch(() => {});

    // Clean up dependent child tables to prevent foreign key errors
    await pool.execute('DELETE FROM sub_branches WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM branches WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM employee_attendance WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM employee_leaves WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM payroll WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM invoices WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM projects WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM customers WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM leads WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM deals WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM expenses WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute('DELETE FROM tickets WHERE company_id = ?', [compId]).catch(() => {});
    await pool.execute(
      'DELETE FROM app_data WHERE module_key IN (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        `branches_${compId}`, `branches_${compSlug}`,
        `companies_${compId}`, `companies_${compSlug}`,
        `invoices_${compId}`, `invoices_${compSlug}`,
        `settings_${compId}`, `settings_${compSlug}`
      ]
    ).catch(() => {});

    // Delete company record from database
    await pool.execute('DELETE FROM companies WHERE id = ?', [compId]);

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
