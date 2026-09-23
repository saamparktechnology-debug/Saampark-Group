const pool = require('../config/db');

const quotationModel = {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO quotations (company_id, branch_id, customer_id, quotation_number, title, description, subtotal, discount_percent, discount_amount, tax_percent, tax_amount, total, validity_days, terms, notes, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.company_id, data.branch_id || null, data.customer_id, data.quotation_number, data.title || null,
         data.description || null, data.subtotal || 0, data.discount_percent || 0, data.discount_amount || 0,
         data.tax_percent || 0, data.tax_amount || 0, data.total || 0, data.validity_days || 30,
         data.terms || null, data.notes || null, data.status || 'draft', data.created_by || null]
      );
      const quoteId = result.insertId;

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [quoteId, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0,
             item.discount_percent || 0, item.tax_percent || 0, item.total || 0]
          );
        }
      }
      await conn.commit();
      return quoteId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT q.*, c.name as customer_name FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id WHERE q.id = ?`, [id]
    );
    if (!rows[0]) return null;
    const [items] = await pool.execute('SELECT * FROM quotation_items WHERE quotation_id = ?', [id]);
    return { ...rows[0], items };
  },

  async findByCompany(company_id, { status, branch_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT q.*, c.name as customer_name FROM quotations q LEFT JOIN customers c ON q.customer_id = c.id WHERE q.company_id = ?';
    const params = [company_id];
    if (branch_id && branch_id !== 'all') { query += ' AND (q.branch_id = ? OR q.branch_id IS NULL)'; params.push(branch_id); }
    if (status) { query += ' AND q.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY q.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM quotations WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'items') { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE quotations SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    if (data.items) {
      await pool.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
      for (const item of data.items) {
        await pool.execute(
          `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.discount_percent || 0, item.tax_percent || 0, item.total || 0]
        );
      }
    }
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
    await pool.execute('DELETE FROM quotations WHERE id = ?', [id]);
    return true;
  },

  async convertToInvoice(id, companyId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [quote] = await conn.execute('SELECT * FROM quotations WHERE id = ?', [id]);
      if (!quote[0]) throw new Error('Quotation not found');

      const q = quote[0];
      const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM invoices WHERE company_id = ?', [companyId]);
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;

      const [invResult] = await conn.execute(
        `INSERT INTO invoices (company_id, client_id, invoice_number, total_amount, status, due_date, created_by)
         VALUES (?, ?, ?, ?, 'Not_paid', DATE_ADD(NOW(), INTERVAL 30 DAY), ?)`,
        [companyId, q.customer_id, invoiceNumber, q.total, q.created_by]
      );

      const [items] = await conn.execute('SELECT * FROM quotation_items WHERE quotation_id = ?', [id]);
      for (const item of items) {
        await conn.execute(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [invResult.insertId, item.product_id, item.description, item.quantity, item.unit_price, item.discount_percent, item.tax_percent, item.total]
        );
      }

      await conn.execute('UPDATE quotations SET status = ?, converted_to_invoice = 1, invoice_id = ? WHERE id = ?',
        ['accepted', invResult.insertId, id]);

      await conn.commit();
      return invResult.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

const estimateModel = {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO estimates (company_id, branch_id, customer_id, estimate_number, title, description, subtotal, discount_percent, discount_amount, tax_percent, tax_amount, total, validity_days, terms, notes, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.company_id, data.branch_id || null, data.customer_id, data.estimate_number, data.title || null,
         data.description || null, data.subtotal || 0, data.discount_percent || 0, data.discount_amount || 0,
         data.tax_percent || 0, data.tax_amount || 0, data.total || 0, data.validity_days || 30,
         data.terms || null, data.notes || null, data.status || 'draft', data.created_by || null]
      );
      const estId = result.insertId;
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO estimate_items (estimate_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [estId, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.discount_percent || 0, item.tax_percent || 0, item.total || 0]
          );
        }
      }
      await conn.commit();
      return estId;
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT e.*, c.name as customer_name FROM estimates e LEFT JOIN customers c ON e.customer_id = c.id WHERE e.id = ?', [id]);
    if (!rows[0]) return null;
    const [items] = await pool.execute('SELECT * FROM estimate_items WHERE estimate_id = ?', [id]);
    return { ...rows[0], items };
  },

  async findByCompany(company_id, { status, branch_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT e.*, c.name as customer_name FROM estimates e LEFT JOIN customers c ON e.customer_id = c.id WHERE e.company_id = ?';
    const params = [company_id];
    if (branch_id && branch_id !== 'all') { query += ' AND (e.branch_id = ? OR e.branch_id IS NULL)'; params.push(branch_id); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY e.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM estimates WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'items') { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length > 0) { values.push(id); await pool.execute(`UPDATE estimates SET ${fields.join(', ')} WHERE id = ?`, values); }
    if (data.items) {
      await pool.execute('DELETE FROM estimate_items WHERE estimate_id = ?', [id]);
      for (const item of data.items) {
        await pool.execute('INSERT INTO estimate_items (estimate_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.discount_percent || 0, item.tax_percent || 0, item.total || 0]);
      }
    }
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM estimate_items WHERE estimate_id = ?', [id]);
    await pool.execute('DELETE FROM estimates WHERE id = ?', [id]);
    return true;
  }
};

const salesOrderModel = {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO sales_orders (company_id, branch_id, customer_id, order_number, quotation_id, order_date, delivery_date, shipping_address, subtotal, discount_amount, tax_amount, shipping_cost, total, payment_status, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.company_id, data.branch_id || null, data.customer_id, data.order_number, data.quotation_id || null,
         data.order_date, data.delivery_date || null, data.shipping_address || null,
         data.subtotal || 0, data.discount_amount || 0, data.tax_amount || 0, data.shipping_cost || 0,
         data.total || 0, data.payment_status || 'unpaid', data.status || 'pending', data.notes || null, data.created_by || null]
      );
      const soId = result.insertId;
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO sales_order_items (sales_order_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [soId, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.discount_percent || 0, item.tax_percent || 0, item.total || 0]
          );
        }
      }
      await conn.commit();
      return soId;
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT so.*, c.name as customer_name FROM sales_orders so LEFT JOIN customers c ON so.customer_id = c.id WHERE so.id = ?', [id]);
    if (!rows[0]) return null;
    const [items] = await pool.execute('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [id]);
    return { ...rows[0], items };
  },

  async findByCompany(company_id, { status, branch_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT so.*, c.name as customer_name FROM sales_orders so LEFT JOIN customers c ON so.customer_id = c.id WHERE so.company_id = ?';
    const params = [company_id];
    if (branch_id && branch_id !== 'all') { query += ' AND (so.branch_id = ? OR so.branch_id IS NULL)'; params.push(branch_id); }
    if (status) { query += ' AND so.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY so.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM sales_orders WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && key !== 'items') { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length > 0) { values.push(id); await pool.execute(`UPDATE sales_orders SET ${fields.join(', ')} WHERE id = ?`, values); }
    if (data.items) {
      await pool.execute('DELETE FROM sales_order_items WHERE sales_order_id = ?', [id]);
      for (const item of data.items) {
        await pool.execute('INSERT INTO sales_order_items (sales_order_id, product_id, description, quantity, unit_price, discount_percent, tax_percent, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, item.product_id || null, item.description, item.quantity || 1, item.unit_price || 0, item.discount_percent || 0, item.tax_percent || 0, item.total || 0]);
      }
    }
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM sales_order_items WHERE sales_order_id = ?', [id]);
    await pool.execute('DELETE FROM sales_orders WHERE id = ?', [id]);
    return true;
  }
};

const paymentModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO payments (company_id, branch_id, invoice_id, customer_id, vendor_id, payment_number, payment_date, amount, payment_method, reference_number, bank_account_id, cheque_number, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.branch_id || null, data.invoice_id || null, data.customer_id || null,
       data.vendor_id || null, data.payment_number, data.payment_date, data.amount,
       data.payment_method || 'cash', data.reference_number || null, data.bank_account_id || null,
       data.cheque_number || null, data.notes || null, data.status || 'completed', data.created_by || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id, { type, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM payments WHERE company_id = ?';
    const params = [company_id];
    if (type === 'customer') { query += ' AND customer_id IS NOT NULL'; }
    if (type === 'vendor') { query += ' AND vendor_id IS NOT NULL'; }
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async delete(id) {
    await pool.execute('DELETE FROM payments WHERE id = ?', [id]);
    return true;
  }
};

const creditNoteModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO credit_notes (company_id, customer_id, invoice_id, credit_note_number, date, amount, reason, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.customer_id, data.invoice_id || null, data.credit_note_number, data.date, data.amount, data.reason || null, data.status || 'open', data.created_by || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT cn.*, c.name as customer_name FROM credit_notes cn
       LEFT JOIN customers c ON cn.customer_id = c.id
       WHERE cn.company_id = ? ORDER BY cn.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`, [company_id]
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
    await pool.execute(`UPDATE credit_notes SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }
};

const debitNoteModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO debit_notes (company_id, vendor_id, purchase_invoice_id, debit_note_number, date, amount, reason, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.vendor_id || null, data.purchase_invoice_id || null, data.debit_note_number, data.date, data.amount, data.reason || null, data.status || 'open', data.created_by || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT dn.*, v.name as vendor_name FROM debit_notes dn
       LEFT JOIN vendors v ON dn.vendor_id = v.id
       WHERE dn.company_id = ? ORDER BY dn.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`, [company_id]
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
    await pool.execute(`UPDATE debit_notes SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }
};

module.exports = { quotationModel, estimateModel, salesOrderModel, paymentModel, creditNoteModel, debitNoteModel };
