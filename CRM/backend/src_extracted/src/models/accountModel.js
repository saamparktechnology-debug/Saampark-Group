const pool = require('../config/db');

const transactionModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO transactions (company_id, branch_id, transaction_number, type, category, account_id, bank_account_id, amount, date, reference, description, payment_method, cheque_number, module_type, module_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.branch_id || null, data.transaction_number, data.type, data.category || null,
       data.account_id || null, data.bank_account_id || null, data.amount, data.date,
       data.reference || null, data.description || null, data.payment_method || null,
       data.cheque_number || null, data.module_type || null, data.module_id || null, data.created_by || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id, { type, category, from_date, to_date, page = 1, limit = 100 } = {}) {
    let query = 'SELECT * FROM transactions WHERE company_id = ?';
    const params = [company_id];
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (from_date) { query += ' AND date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND date <= ?'; params.push(to_date); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY date DESC, created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async getSummary(company_id, { from_date, to_date } = {}) {
    let incomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE company_id = ? AND type = "income"';
    let expenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE company_id = ? AND type = "expense"';
    const params = [company_id];

    if (from_date) { incomeQuery += ' AND date >= ?'; expenseQuery += ' AND date >= ?'; }
    if (to_date) { incomeQuery += ' AND date <= ?'; expenseQuery += ' AND date <= ?'; }

    const incomeParams = [...params];
    const expenseParams = [...params];
    if (from_date) { incomeParams.push(from_date); expenseParams.push(from_date); }
    if (to_date) { incomeParams.push(to_date); expenseParams.push(to_date); }

    const [income] = await pool.execute(incomeQuery, incomeParams);
    const [expense] = await pool.execute(expenseQuery, expenseParams);

    return {
      income: income[0].total,
      expense: expense[0].total,
      profit: income[0].total - expense[0].total
    };
  },

  async delete(id) {
    await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  }
};

const bankAccountModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO bank_accounts (company_id, bank_name, account_holder, account_number, ifsc_code, branch, opening_balance, current_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.bank_name, data.account_holder || null, data.account_number,
       data.ifsc_code || null, data.branch || null, data.opening_balance || 0, data.opening_balance || 0]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM bank_accounts WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute('SELECT * FROM bank_accounts WHERE company_id = ? ORDER BY bank_name', [company_id]);
    return rows;
  },

  async updateBalance(id, amount) {
    await pool.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, id]);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM bank_accounts WHERE id = ?', [id]);
    return true;
  }
};

const chartOfAccountsModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, parent_id) VALUES (?, ?, ?, ?, ?)`,
      [data.company_id, data.account_code, data.account_name, data.account_type, data.parent_id || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute('SELECT * FROM chart_of_accounts WHERE company_id = ? ORDER BY account_code', [company_id]);
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
    await pool.execute(`UPDATE chart_of_accounts SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM chart_of_accounts WHERE id = ?', [id]);
    return true;
  }
};

const categoryModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO account_categories (company_id, name, type, parent_id) VALUES (?, ?, ?, ?)',
      [data.company_id, data.name, data.type, data.parent_id || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, type) {
    let query = 'SELECT * FROM account_categories WHERE company_id = ?';
    const params = [company_id];
    if (type) { query += ' AND type = ?'; params.push(type); }
    query += ' ORDER BY name';
    const [rows] = await pool.execute(query, params);
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
    await pool.execute(`UPDATE account_categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM account_categories WHERE id = ?', [id]);
    return true;
  }
};

const taxRateModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO tax_rates (company_id, name, rate, type, is_inclusive) VALUES (?, ?, ?, ?, ?)',
      [data.company_id, data.name, data.rate, data.type || 'GST', data.is_inclusive || 0]
    );
    return result.insertId;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute('SELECT * FROM tax_rates WHERE company_id = ? AND is_active = 1 ORDER BY rate', [company_id]);
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
    await pool.execute(`UPDATE tax_rates SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM tax_rates WHERE id = ?', [id]);
    return true;
  }
};

module.exports = { transactionModel, bankAccountModel, chartOfAccountsModel, categoryModel, taxRateModel };
