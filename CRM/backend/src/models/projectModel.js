const pool = require('../config/db');

const projectModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO projects (title, client_id, company_id, project_type, status, progress, price, start_date, deadline, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.client_id || null, data.company_id || null, data.project_type || null,
       data.status || 'Open', data.progress || 0, data.price || 0,
       data.start_date || null, data.deadline || null, data.description || null, data.created_by || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, c.name as client_name FROM projects p
       LEFT JOIN customers c ON p.client_id = c.id WHERE p.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { status, page = 1, limit = 50 } = {}) {
    let query = 'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN customers c ON p.client_id = c.id WHERE p.company_id = ?';
    const params = [company_id];
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM projects WHERE company_id = ?', [company_id]);
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
    await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  }
};

const milestoneModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO milestones (project_id, title, description, due_date, status, progress) VALUES (?, ?, ?, ?, ?, ?)',
      [data.project_id, data.title, data.description || null, data.due_date || null, data.status || 'pending', data.progress || 0]
    );
    return result.insertId;
  },

  async findByProject(project_id) {
    const [rows] = await pool.execute('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date', [project_id]);
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
    await pool.execute(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM milestones WHERE id = ?', [id]);
    return true;
  }
};

const subtaskModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO subtasks (task_id, title, status, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)',
      [data.task_id, data.title, data.status || 'pending', data.assigned_to || null, data.due_date || null]
    );
    return result.insertId;
  },

  async findByTask(task_id) {
    const [rows] = await pool.execute(
      `SELECT st.*, u.full_name as assigned_name FROM subtasks st
       LEFT JOIN users u ON st.assigned_to = u.id
       WHERE st.task_id = ? ORDER BY st.created_at`, [task_id]
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
    await pool.execute(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM subtasks WHERE id = ?', [id]);
    return true;
  }
};

const timesheetModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO timesheets (company_id, employee_id, project_id, task_id, date, hours, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.employee_id, data.project_id || null, data.task_id || null,
       data.date, data.hours, data.description || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, { employee_id, project_id, from_date, to_date, page = 1, limit = 50 } = {}) {
    let query = `SELECT ts.*, e.first_name, e.last_name, p.title as project_name
                 FROM timesheets ts
                 JOIN employees e ON ts.employee_id = e.id
                 LEFT JOIN projects p ON ts.project_id = p.id
                 WHERE ts.company_id = ?`;
    const params = [company_id];
    if (employee_id) { query += ' AND ts.employee_id = ?'; params.push(employee_id); }
    if (project_id) { query += ' AND ts.project_id = ?'; params.push(project_id); }
    if (from_date) { query += ' AND ts.date >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND ts.date <= ?'; params.push(to_date); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY ts.date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async approve(id, approved_by) {
    await pool.execute("UPDATE timesheets SET status = 'approved', approved_by = ? WHERE id = ?", [approved_by, id]);
  },

  async delete(id) {
    await pool.execute('DELETE FROM timesheets WHERE id = ?', [id]);
    return true;
  }
};

module.exports = { projectModel, milestoneModel, subtaskModel, timesheetModel };
