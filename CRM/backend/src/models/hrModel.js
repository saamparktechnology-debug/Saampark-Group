const pool = require('../config/db');

const employeeModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO employees (company_id, branch_id, user_id, employee_code, first_name, last_name, email, phone, department_id, designation_id, date_of_joining, date_of_birth, gender, address, emergency_contact, emergency_phone, bank_name, bank_account, ifsc_code, basic_salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.branch_id || null, data.user_id || null, data.employee_code, data.first_name, data.last_name,
       data.email, data.phone || null, data.department_id || null, data.designation_id || null,
       data.date_of_joining || null, data.date_of_birth || null, data.gender || null,
       data.address || null, data.emergency_contact || null, data.emergency_phone || null,
       data.bank_name || null, data.bank_account || null, data.ifsc_code || null,
       data.basic_salary || 0, data.status || 'active']
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, d.name as department_name, des.name as designation_name, b.name as branch_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN designations des ON e.designation_id = des.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { search, department_id, status, page = 1, limit = 50 } = {}) {
    let query = 'SELECT e.*, d.name as department_name, des.name as designation_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id LEFT JOIN designations des ON e.designation_id = des.id WHERE e.company_id = ?';
    const params = [company_id];
    if (search) { query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    if (department_id) { query += ' AND e.department_id = ?'; params.push(department_id); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY e.first_name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM employees WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM employees WHERE id = ?', [id]);
    return true;
  }
};

const attendanceModel = {
  async clockIn(company_id, employee_id, note = null) {
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await pool.execute(
      'SELECT * FROM employee_attendance WHERE employee_id = ? AND date = ?', [employee_id, today]
    );
    if (existing.length > 0) {
      throw new Error('Already clocked in today');
    }
    const [result] = await pool.execute(
      'INSERT INTO employee_attendance (company_id, employee_id, date, clock_in, notes) VALUES (?, ?, ?, NOW(), ?)',
      [company_id, employee_id, today, note]
    );
    return result.insertId;
  },

  async clockOut(employee_id) {
    const today = new Date().toISOString().split('T')[0];
    const [existing] = await pool.execute(
      'SELECT * FROM employee_attendance WHERE employee_id = ? AND date = ? AND clock_out IS NULL', [employee_id, today]
    );
    if (existing.length === 0) throw new Error('No active clock-in found');

    await pool.execute(
      `UPDATE employee_attendance SET clock_out = NOW(),
       total_hours = TIMESTAMPDIFF(SECOND, clock_in, NOW()) / 3600.0
       WHERE id = ?`, [existing[0].id]
    );
    return existing[0].id;
  },

  async getStatus(employee_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      'SELECT * FROM employee_attendance WHERE employee_id = ? AND date = ?', [employee_id, today]
    );
    return rows[0] || null;
  },

  async findByEmployee(employee_id, { from_date, to_date, page = 1, limit = 30 } = {}) {
    let query = 'SELECT * FROM employee_attendance WHERE employee_id = ?';
    const params = [employee_id];
    if (from_date) { query += ' AND date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND date <= ?'; params.push(to_date); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findByCompany(company_id, { date, department_id, page = 1, limit = 100 } = {}) {
    let query = `SELECT ea.*, e.first_name, e.last_name, e.employee_code
                 FROM employee_attendance ea
                 JOIN employees e ON ea.employee_id = e.id
                 WHERE ea.company_id = ?`;
    const params = [company_id];
    if (date) { query += ' AND ea.date = ?'; params.push(date); }
    if (department_id) { query += ' AND e.department_id = ?'; params.push(department_id); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY ea.date DESC, e.first_name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  }
};

const leaveModel = {
  async createLeaveType(data) {
    const [result] = await pool.execute(
      'INSERT INTO leave_types (company_id, name, days_per_year, is_paid) VALUES (?, ?, ?, ?)',
      [data.company_id, data.name, data.days_per_year || 0, data.is_paid || 1]
    );
    return result.insertId;
  },

  async getLeaveTypes(company_id) {
    const [rows] = await pool.execute('SELECT * FROM leave_types WHERE company_id = ? AND is_active = 1 ORDER BY name', [company_id]);
    return rows;
  },

  async requestLeave(data) {
    const [result] = await pool.execute(
      `INSERT INTO leave_requests (company_id, employee_id, leave_type_id, from_date, to_date, days, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.employee_id, data.leave_type_id, data.from_date, data.to_date, data.days, data.reason || null]
    );
    return result.insertId;
  },

  async getLeaveRequests(company_id, { employee_id, status, page = 1, limit = 50 } = {}) {
    let query = `SELECT lr.*, lt.name as leave_type_name, e.first_name, e.last_name
                 FROM leave_requests lr
                 JOIN leave_types lt ON lr.leave_type_id = lt.id
                 JOIN employees e ON lr.employee_id = e.id
                 WHERE lr.company_id = ?`;
    const params = [company_id];
    if (employee_id) { query += ' AND lr.employee_id = ?'; params.push(employee_id); }
    if (status) { query += ' AND lr.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY lr.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async approveLeave(id, approved_by) {
    await pool.execute(
      "UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?",
      [approved_by, id]
    );
  },

  async rejectLeave(id, approved_by) {
    await pool.execute(
      "UPDATE leave_requests SET status = 'rejected', approved_by = ?, approved_at = NOW() WHERE id = ?",
      [approved_by, id]
    );
  }
};

const payrollModel = {
  async create(data) {
    const net = (data.basic_salary || 0) + (data.allowances || 0) - (data.deductions || 0) - (data.tax || 0);
    const [result] = await pool.execute(
      `INSERT INTO payroll (company_id, employee_id, month, year, basic_salary, allowances, deductions, tax, net_salary, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.employee_id, data.month, data.year, data.basic_salary || 0,
       data.allowances || 0, data.deductions || 0, data.tax || 0, net, data.payment_status || 'unpaid']
    );
    return result.insertId;
  },

  async findByCompany(company_id, { month, year, employee_id, page = 1, limit = 50 } = {}) {
    let query = `SELECT py.*, e.first_name, e.last_name, e.employee_code
                 FROM payroll py JOIN employees e ON py.employee_id = e.id
                 WHERE py.company_id = ?`;
    const params = [company_id];
    if (month) { query += ' AND py.month = ?'; params.push(month); }
    if (year) { query += ' AND py.year = ?'; params.push(year); }
    if (employee_id) { query += ' AND py.employee_id = ?'; params.push(employee_id); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY py.year DESC, py.month DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async markPaid(id) {
    await pool.execute("UPDATE payroll SET payment_status = 'paid', paid_at = NOW() WHERE id = ?", [id]);
  }
};

const performanceModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO performance_reviews (company_id, employee_id, reviewer_id, review_period, rating, strengths, improvements, goals, comments, status, review_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.employee_id, data.reviewer_id, data.review_period || null,
       data.rating || 0, data.strengths || null, data.improvements || null,
       data.goals || null, data.comments || null, data.status || 'draft', data.review_date || null]
    );
    return result.insertId;
  },

  async findByEmployee(employee_id) {
    const [rows] = await pool.execute(
      `SELECT pr.*, u.full_name as reviewer_name FROM performance_reviews pr
       LEFT JOIN users u ON pr.reviewer_id = u.id
       WHERE pr.employee_id = ? ORDER BY pr.created_at DESC`, [employee_id]
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
    await pool.execute(`UPDATE performance_reviews SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }
};

const employeeDocumentModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO employee_documents (company_id, employee_id, document_type, document_name, file_url, expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.company_id, data.employee_id, data.document_type, data.document_name, data.file_url, data.expiry_date || null, data.notes || null]
    );
    return result.insertId;
  },

  async findByEmployee(employee_id) {
    const [rows] = await pool.execute('SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC', [employee_id]);
    return rows;
  },

  async getExpiringDocuments(company_id, days = 30) {
    const [rows] = await pool.execute(
      `SELECT ed.*, e.first_name, e.last_name FROM employee_documents ed
       JOIN employees e ON ed.employee_id = e.id
       WHERE ed.company_id = ? AND ed.expiry_date IS NOT NULL
       AND ed.expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
       ORDER BY ed.expiry_date`, [company_id, days]
    );
    return rows;
  },

  async delete(id) {
    await pool.execute('DELETE FROM employee_documents WHERE id = ?', [id]);
    return true;
  }
};

module.exports = { employeeModel, attendanceModel, leaveModel, payrollModel, performanceModel, employeeDocumentModel };
