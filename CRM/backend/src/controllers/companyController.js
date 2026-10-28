const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── GET ALL COMPANIES ─────────────────────────────────────────────────────────
const getAllCompanies = async (req, res, next) => {
  try {
    let query = `SELECT c.*, COUNT(DISTINCT u.id) as member_count
                 FROM companies c
                 LEFT JOIN users u ON u.company_id = c.id AND u.deleted_at IS NULL`;
    const params = [];

    // Role check: If requester is authenticated and is NOT Super Admin, filter to assigned company
    if (req.user) {
      const userRoleId = Number(req.user.role_id);
      const isSuper = userRoleId === 1 || String(req.user.role || req.user.role_name || '').toLowerCase().includes('super') || req.user.email === 'hiisupriya@gmail.com' || req.user.email === 'saampark.official@gmail.com';
      
      if (!isSuper) {
        // Find assigned companies for this user
        let assignedComp = req.user.company_id;
        let assignedComps = [];
        try {
          const [uRows] = await pool.execute('SELECT company_id, company_ids FROM users WHERE id = ?', [req.user.id]);
          if (uRows.length > 0) {
            if (uRows[0].company_id) assignedComp = uRows[0].company_id;
            if (uRows[0].company_ids) {
              const parsed = typeof uRows[0].company_ids === 'string' ? JSON.parse(uRows[0].company_ids) : uRows[0].company_ids;
              if (Array.isArray(parsed)) assignedComps = parsed;
            }
          }
        } catch (e) {}

        const allAllowed = Array.from(new Set([assignedComp, ...assignedComps].filter(Boolean))).map(s => String(s).trim());
        if (allAllowed.length > 0) {
          const placeholders = allAllowed.map(() => '(c.id = ? OR c.slug = ?)').join(' OR ');
          query += ` WHERE (${placeholders})`;
          for (const item of allAllowed) {
            params.push(item, item);
          }
        }
      }
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;
    const [companies] = await pool.execute(query, params);
    return successResponse(res, 200, 'Companies fetched', companies);
  } catch (error) { next(error); }
};

// ─── GET SINGLE COMPANY ────────────────────────────────────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const [companies] = await pool.execute('SELECT * FROM companies WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
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
    const userRoleId = Number(req.user?.role_id);
    const userRole = String(req.user?.role || req.user?.role_name || '').toLowerCase();
    const isSuper = userRoleId === 1 || userRole.includes('super') || req.user?.email === 'hiisupriya@gmail.com' || req.user?.email === 'saampark.official@gmail.com';

    const isNumericParam = Number.isFinite(Number(req.params.id));
    const [targetRows] = await pool.execute(
      isNumericParam 
        ? 'SELECT id, slug FROM companies WHERE id = ? UNION SELECT id, slug FROM companies WHERE slug = ? LIMIT 1'
        : 'SELECT id, slug FROM companies WHERE slug = ? UNION SELECT id, slug FROM companies WHERE id = ? LIMIT 1',
      [req.params.id, req.params.id]
    );
    if (!targetRows.length) return errorResponse(res, 404, 'Company not found.');

    const numericId = targetRows[0].id;
    const oldSlug = targetRows[0].slug ? String(targetRows[0].slug).toLowerCase().trim() : null;
    const targetIdStr = String(numericId).toLowerCase();

    if (!isSuper) {
      const isAdmin = userRoleId === 2 || userRole.includes('admin');
      if (!isAdmin) {
        return errorResponse(res, 403, 'Access denied: You do not have permission to update company details.');
      }

      let assignedComp = req.user.company_id;
      let assignedComps = [];
      try {
        const [uRows] = await pool.execute('SELECT company_id, company_ids FROM users WHERE id = ?', [req.user.id]);
        if (uRows.length > 0) {
          if (uRows[0].company_id) assignedComp = uRows[0].company_id;
          if (uRows[0].company_ids) {
            const parsed = typeof uRows[0].company_ids === 'string' ? JSON.parse(uRows[0].company_ids) : uRows[0].company_ids;
            if (Array.isArray(parsed)) assignedComps = parsed;
          }
        }
      } catch (e) {}

      const allAllowed = Array.from(new Set([assignedComp, ...assignedComps].filter(Boolean))).map(s => String(s).toLowerCase().trim());
      const targetParam = String(req.params.id).toLowerCase().trim();

      const canUpdate = allAllowed.some(a => a === targetParam || a === targetIdStr || (oldSlug && a === oldSlug));
      if (!canUpdate) {
        return errorResponse(res, 403, 'Access denied: You can only edit your assigned company.');
      }

      // Non-super-admin is NOT permitted to rename company slug (prevents breaking foreign references & lockouts)
      delete req.body.slug;
    }

    const isSlugRenamed = Boolean(req.body.slug && oldSlug && String(req.body.slug).toLowerCase().trim() !== oldSlug);
    const newSlug = isSlugRenamed ? String(req.body.slug).toLowerCase().trim() : (oldSlug || targetParam);

    // If super admin is changing the slug, ensure it does not conflict with another company
    if (isSlugRenamed) {
      const [conflictRows] = await pool.execute(
        'SELECT id FROM companies WHERE (slug = ? OR id = ?) AND id != ?',
        [newSlug, newSlug, numericId]
      );
      if (conflictRows.length > 0) {
        return errorResponse(res, 409, 'A company with this slug or ID already exists.');
      }
    }
    
    const allowedFields = [
      'name', ...(isSuper ? ['slug'] : []), 'currency', 'currency_symbol', 'logo_url', 'address', 'industry', 'phone', 'email',
      'brand_name', 'division_name', 'subtitle', 'trademark_symbol', 'iso_certification', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
      'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
      'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
      'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
      'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url',
      'signature_position', 'stamp_position', 'logo_position', 'logo_scale', 'stamp_scale', 'signature_scale', 'custom_stamps', 'zoom', 'preview_scale', 'preview_invoice_type', 'invoice_customization'
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        let val = req.body[field];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        } else if (val === '') {
          val = null;
        }
        values.push(val);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(numericId);
      // Strictly update by numericId to never collide with other rows sharing slug or ID
      const [updateResult] = await pool.execute(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, values).catch(err => {
        console.warn('MySQL company update column fallback:', err.message);
        return [null];
      });

      if (!updateResult || updateResult.affectedRows === 0) {
        const compSlug = String(req.body.slug || oldSlug || req.params.id).toLowerCase();
        const insertCols = ['name', 'slug'];
        const insertPlaceholders = ['?', '?'];
        const insertVals = [req.body.name || req.params.id, compSlug];
        for (const field of allowedFields) {
          if (field !== 'name' && field !== 'slug' && req.body[field] !== undefined) {
            insertCols.push(field);
            insertPlaceholders.push('?');
            let val = req.body[field];
            if (typeof val === 'object' && val !== null) {
              val = JSON.stringify(val);
            } else if (val === '') {
              val = null;
            }
            insertVals.push(val);
          }
        }
        await pool.execute(
          `INSERT INTO companies (${insertCols.join(', ')}) VALUES (${insertPlaceholders.join(', ')})
           ON DUPLICATE KEY UPDATE updated_at = NOW()`,
          insertVals
        ).catch(e => console.warn('Company insert fallback notice:', e.message));
      }
    }

    // When a super admin renames a slug, propagate changes to references (users, branches, sub-branches)
    if (isSlugRenamed && oldSlug) {
      // 1. Update users assigned to this company slug
      await pool.execute('UPDATE users SET company_id = ? WHERE company_id = ?', [newSlug, oldSlug]).catch(() => {});
      try {
        const [uRows] = await pool.execute('SELECT id, company_ids FROM users WHERE company_ids LIKE ?', [`%"${oldSlug}"%`]);
        for (const u of uRows) {
          if (u.company_ids) {
            let arr = typeof u.company_ids === 'string' ? JSON.parse(u.company_ids) : u.company_ids;
            if (Array.isArray(arr) && arr.includes(oldSlug)) {
              arr = arr.map(s => s === oldSlug ? newSlug : s);
              await pool.execute('UPDATE users SET company_ids = ? WHERE id = ?', [JSON.stringify(arr), u.id]);
            }
          }
        }
      } catch (e) {}

      // 2. Update branches referencing the old slug
      await pool.execute('UPDATE branches SET company_id = ? WHERE company_id = ?', [numericId, oldSlug]).catch(() => {});

      // 3. Migrate branches in app_data
      try {
        const [bRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "branches"');
        if (bRows.length > 0 && bRows[0].data_json) {
          let bList = JSON.parse(bRows[0].data_json);
          if (Array.isArray(bList)) {
            let changed = false;
            bList = bList.map(b => {
              const bComp = String(b.company_id || b.companyId || '').toLowerCase().trim();
              if (bComp === oldSlug) {
                changed = true;
                return { ...b, company_id: numericId, companyId: newSlug };
              }
              return b;
            });
            if (changed) {
              await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "branches"', [JSON.stringify(bList)]);
            }
          }
        }
      } catch (e) {}

      // 4. Migrate sub_branches in app_data
      try {
        const [sbRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "sub_branches"');
        if (sbRows.length > 0 && sbRows[0].data_json) {
          let sbList = JSON.parse(sbRows[0].data_json);
          if (Array.isArray(sbList)) {
            let changed = false;
            sbList = sbList.map(sb => {
              const sbComp = String(sb.company_id || sb.companyId || '').toLowerCase().trim();
              if (sbComp === oldSlug) {
                changed = true;
                return { ...sb, company_id: numericId, companyId: newSlug };
              }
              return sb;
            });
            if (changed) {
              await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "sub_branches"', [JSON.stringify(sbList)]);
            }
          }
        }
      } catch (e) {}
    }

    // Also sync to app_data table in MySQL for guaranteed persistence
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "companies"');
      let currentList = [];
      if (appDataRows.length > 0 && appDataRows[0].data_json) {
        try { currentList = JSON.parse(appDataRows[0].data_json); } catch {}
      }
      if (!Array.isArray(currentList)) currentList = [];
      
      // Match on the old slug from row BEFORE update to avoid cross-tenant corruptions
      const oldTarget = String(oldSlug || req.params.id).toLowerCase();
      const targetSlug = String(req.body.slug || oldSlug || req.params.id).toLowerCase();
      const matches = (c, key) => String(c.id).toLowerCase() === key || String(c.slug || '').toLowerCase() === key;
      const existingIdx = currentList.findIndex(c => matches(c, oldTarget) || matches(c, String(numericId)));

      const updatedComp = { 
        ...(existingIdx >= 0 ? currentList[existingIdx] : {}), 
        ...req.body, 
        id: targetSlug, 
        slug: targetSlug,
        numeric_id: numericId
      };
      if (existingIdx >= 0) {
        currentList[existingIdx] = updatedComp;
      } else {
        currentList.push(updatedComp);
      }
      await pool.execute(
        `INSERT INTO app_data (module_key, data_json) VALUES ("companies", ?)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
        [JSON.stringify(currentList)]
      );
    } catch (appDataErr) {
      console.warn('app_data sync notice:', appDataErr.message);
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
