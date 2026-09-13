const pool = require('../config/db');

const enquiryModel = {
  async create(data) {
    const fields = ['company_id', 'branch_id', 'lead_id', 'customer_id', 'subject', 'description', 'source', 'type', 'priority', 'status', 'assigned_to', 'created_by'];
    const values = fields.map(f => data[f] !== undefined ? data[f] : null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO enquiries (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, u.full_name as assigned_name, c.name as customer_name
       FROM enquiries e
       LEFT JOIN users u ON e.assigned_to = u.id
       LEFT JOIN customers c ON e.customer_id = c.id
       WHERE e.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { status, priority, assigned_to, page = 1, limit = 50 } = {}) {
    let query = 'SELECT e.*, u.full_name as assigned_name FROM enquiries e LEFT JOIN users u ON e.assigned_to = u.id WHERE e.company_id = ?';
    const params = [company_id];

    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (priority) { query += ' AND e.priority = ?'; params.push(priority); }
    if (assigned_to) { query += ' AND e.assigned_to = ?'; params.push(assigned_to); }

    const offset = (page - 1) * limit;
    query += ` ORDER BY e.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM enquiries WHERE company_id = ?', [company_id]);
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
    await pool.execute(`UPDATE enquiries SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM enquiries WHERE id = ?', [id]);
    return true;
  }
};

const followUpModel = {
  async create(data) {
    const fields = ['company_id', 'lead_id', 'customer_id', 'enquiry_id', 'type', 'subject', 'description', 'scheduled_at', 'status', 'assigned_to', 'created_by'];
    const values = fields.map(f => data[f] !== undefined ? data[f] : null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO follow_ups (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT f.*, u.full_name as assigned_name FROM follow_ups f
       LEFT JOIN users u ON f.assigned_to = u.id WHERE f.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { status, assigned_to, page = 1, limit = 50 } = {}) {
    let query = 'SELECT f.*, u.full_name as assigned_name FROM follow_ups f LEFT JOIN users u ON f.assigned_to = u.id WHERE f.company_id = ?';
    const params = [company_id];
    if (status) { query += ' AND f.status = ?'; params.push(status); }
    if (assigned_to) { query += ' AND f.assigned_to = ?'; params.push(assigned_to); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY f.scheduled_at ASC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM follow_ups WHERE company_id = ?', [company_id]);
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
    await pool.execute(`UPDATE follow_ups SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM follow_ups WHERE id = ?', [id]);
    return true;
  }
};

const callModel = {
  async create(data) {
    const fields = ['company_id', 'lead_id', 'customer_id', 'direction', 'phone_number', 'duration', 'notes', 'outcome', 'called_by'];
    const values = fields.map(f => data[f] !== undefined ? data[f] : null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO calls (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async findByCompany(company_id, { lead_id, customer_id, page = 1, limit = 50 } = {}) {
    let query = 'SELECT c.*, u.full_name as caller_name FROM calls c LEFT JOIN users u ON c.called_by = u.id WHERE c.company_id = ?';
    const params = [company_id];
    if (lead_id) { query += ' AND c.lead_id = ?'; params.push(lead_id); }
    if (customer_id) { query += ' AND c.customer_id = ?'; params.push(customer_id); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY c.call_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async delete(id) {
    await pool.execute('DELETE FROM calls WHERE id = ?', [id]);
    return true;
  }
};

const meetingModel = {
  async create(data) {
    const fields = ['company_id', 'lead_id', 'customer_id', 'title', 'description', 'meeting_date', 'duration', 'location', 'meeting_url', 'status', 'organized_by'];
    const values = fields.map(f => data[f] !== undefined ? data[f] : null);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO meetings (${fields.join(', ')}) VALUES (${placeholders})`, values
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT m.*, u.full_name as organizer_name FROM meetings m
       LEFT JOIN users u ON m.organized_by = u.id WHERE m.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { status, page = 1, limit = 50 } = {}) {
    let query = 'SELECT m.*, u.full_name as organizer_name FROM meetings m LEFT JOIN users u ON m.organized_by = u.id WHERE m.company_id = ?';
    const params = [company_id];
    if (status) { query += ' AND m.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY m.meeting_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
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
    await pool.execute(`UPDATE meetings SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM meetings WHERE id = ?', [id]);
    return true;
  }
};

const noteModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO notes (company_id, module_type, module_id, content, is_pinned, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.module_type, data.module_id, data.content, data.is_pinned || 0, data.created_by || null]
    );
    return result.insertId;
  },

  async findByModule(company_id, module_type, module_id) {
    const [rows] = await pool.execute(
      `SELECT n.*, u.full_name as author_name FROM notes n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.company_id = ? AND n.module_type = ? AND n.module_id = ?
       ORDER BY n.is_pinned DESC, n.created_at DESC`, [company_id, module_type, module_id]
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
    await pool.execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
    return true;
  }
};

const activityTimelineModel = {
  async create(data) {
    await pool.execute(
      `INSERT INTO activity_timeline (company_id, module_type, module_id, action, description, old_value, new_value, performed_by, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.module_type, data.module_id, data.action, data.description || null,
       data.old_value || null, data.new_value || null, data.performed_by || null, data.ip_address || null, data.user_agent || null]
    );
  },

  async findByModule(company_id, module_type, module_id, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT at.*, u.full_name as performer_name FROM activity_timeline at
       LEFT JOIN users u ON at.performed_by = u.id
       WHERE at.company_id = ? AND at.module_type = ? AND at.module_id = ?
       ORDER BY at.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [company_id, module_type, module_id]
    );
    return rows;
  },

  async findByCompany(company_id, { module_type, page = 1, limit = 100 } = {}) {
    let query = 'SELECT at.*, u.full_name as performer_name FROM activity_timeline at LEFT JOIN users u ON at.performed_by = u.id WHERE at.company_id = ?';
    const params = [company_id];
    if (module_type) { query += ' AND at.module_type = ?'; params.push(module_type); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY at.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  }
};

module.exports = { enquiryModel, followUpModel, callModel, meetingModel, noteModel, activityTimelineModel };
