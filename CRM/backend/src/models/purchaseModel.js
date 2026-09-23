const pool = require('../config/db');

const purchaseOrderModel = {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO purchase_orders (company_id, branch_id, vendor_id, order_number, order_date, expected_date, subtotal, discount_amount, tax_amount, total, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.company_id, data.branch_id || null, data.vendor_id, data.order_number, data.order_date,
         data.expected_date || null, data.subtotal || 0, data.discount_amount || 0,
         data.tax_amount || 0, data.total || 0, data.status || 'pending', data.notes || null, data.created_by || null]
      );
      const poId = result.insertId;
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO purchase_order_items (purchase_order_id, product_id, description, quantity, unit_price, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [poId, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.tax_percent || 0, item.total || 0]
          );
        }
      }
      await conn.commit();
      return poId;
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT po.*, v.name as vendor_name FROM purchase_orders po
       LEFT JOIN vendors v ON po.vendor_id = v.id WHERE po.id = ?`, [id]
    );
    if (!rows[0]) return null;
    const [items] = await pool.execute('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
    return { ...rows[0], items };
  },

  async findByCompany(company_id, { status, branch_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT po.*, v.name as vendor_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id WHERE po.company_id = ?';
    const params = [company_id];
    if (branch_id && branch_id !== 'all') { query += ' AND (po.branch_id = ? OR po.branch_id IS NULL)'; params.push(branch_id); }
    if (status) { query += ' AND po.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY po.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM purchase_orders WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'items') { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length > 0) { values.push(id); await pool.execute(`UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = ?`, values); }
    if (data.items) {
      await pool.execute('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
      for (const item of data.items) {
        await pool.execute('INSERT INTO purchase_order_items (purchase_order_id, product_id, description, quantity, unit_price, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.tax_percent || 0, item.total || 0]);
      }
    }
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
    await pool.execute('DELETE FROM purchase_orders WHERE id = ?', [id]);
    return true;
  }
};

const purchaseInvoiceModel = {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO purchase_invoices (company_id, branch_id, vendor_id, purchase_order_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total, paid_amount, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.company_id, data.branch_id || null, data.vendor_id, data.purchase_order_id || null,
         data.invoice_number, data.invoice_date, data.due_date || null,
         data.subtotal || 0, data.tax_amount || 0, data.total || 0,
         data.paid_amount || 0, data.status || 'unpaid', data.notes || null, data.created_by || null]
      );
      const piId = result.insertId;
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, description, quantity, unit_price, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [piId, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.tax_percent || 0, item.total || 0]
          );
        }
      }
      await conn.commit();
      return piId;
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT pi.*, v.name as vendor_name FROM purchase_invoices pi
       LEFT JOIN vendors v ON pi.vendor_id = v.id WHERE pi.id = ?`, [id]
    );
    if (!rows[0]) return null;
    const [items] = await pool.execute('SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = ?', [id]);
    return { ...rows[0], items };
  },

  async findByCompany(company_id, { status, branch_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT pi.*, v.name as vendor_name FROM purchase_invoices pi LEFT JOIN vendors v ON pi.vendor_id = v.id WHERE pi.company_id = ?';
    const params = [company_id];
    if (branch_id && branch_id !== 'all') { query += ' AND (pi.branch_id = ? OR pi.branch_id IS NULL)'; params.push(branch_id); }
    if (status) { query += ' AND pi.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY pi.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM purchase_invoices WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'items') { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length > 0) { values.push(id); await pool.execute(`UPDATE purchase_invoices SET ${fields.join(', ')} WHERE id = ?`, values); }
    if (data.items) {
      await pool.execute('DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = ?', [id]);
      for (const item of data.items) {
        await pool.execute('INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, description, quantity, unit_price, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.tax_percent || 0, item.total || 0]);
      }
    }
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = ?', [id]);
    await pool.execute('DELETE FROM purchase_invoices WHERE id = ?', [id]);
    return true;
  }
};

const purchaseReturnModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO purchase_returns (company_id, vendor_id, purchase_invoice_id, return_number, return_date, total, reason, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.vendor_id, data.purchase_invoice_id || null, data.return_number, data.return_date, data.total || 0, data.reason || null, data.status || 'pending', data.created_by || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT pr.*, v.name as vendor_name FROM purchase_returns pr
       LEFT JOIN vendors v ON pr.vendor_id = v.id
       WHERE pr.company_id = ? ORDER BY pr.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`, [company_id]
    );
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE purchase_returns SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }
};

module.exports = { purchaseOrderModel, purchaseInvoiceModel, purchaseReturnModel };
