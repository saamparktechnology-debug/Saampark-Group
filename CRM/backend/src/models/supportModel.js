const pool = require('../config/db');

const knowledgeBaseModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO knowledge_base (company_id, category, title, content, tags, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.category, data.title, data.content, data.tags || null, data.created_by || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM knowledge_base WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id, { category, search, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM knowledge_base WHERE company_id = ? AND is_published = 1';
    const params = [company_id];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
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
    await pool.execute(`UPDATE knowledge_base SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async incrementViews(id) {
    await pool.execute('UPDATE knowledge_base SET views = views + 1 WHERE id = ?', [id]);
  },

  async delete(id) {
    await pool.execute('DELETE FROM knowledge_base WHERE id = ?', [id]);
    return true;
  }
};

const slaModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO sla_policies (company_id, name, priority, first_response_hours, resolution_hours, business_hours_only)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.name, data.priority, data.first_response_hours || 4,
       data.resolution_hours || 24, data.business_hours_only || 1]
    );
    return result.insertId;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute('SELECT * FROM sla_policies WHERE company_id = ? ORDER BY name', [company_id]);
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
    await pool.execute(`UPDATE sla_policies SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM sla_policies WHERE id = ?', [id]);
    return true;
  }
};

const notificationModel = {
  async create(data) {
    await pool.execute(
      `INSERT INTO notifications (company_id, user_id, title, message, type, module_type, module_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.user_id, data.title, data.message || null, data.type || 'info',
       data.module_type || null, data.module_id || null]
    );
  },

  async findByUser(user_id, { unread_only, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [user_id];
    if (unread_only) { query += ' AND is_read = 0'; }
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async markRead(id) {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  },

  async markAllRead(user_id) {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [user_id]);
  },

  async getUnreadCount(user_id) {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [user_id]);
    return rows[0].count;
  }
};

const messageTemplateModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO message_templates (company_id, name, type, subject, body, variables) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.name, data.type, data.subject || null, data.body, data.variables || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id, type) {
    let query = 'SELECT * FROM message_templates WHERE company_id = ?';
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
    await pool.execute(`UPDATE message_templates SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM message_templates WHERE id = ?', [id]);
    return true;
  }
};

const documentModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO documents (company_id, branch_id, module_type, module_id, category, name, file_url, file_size, file_type, description, expiry_date, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.branch_id || null, data.module_type || null, data.module_id || null,
       data.category || null, data.name, data.file_url, data.file_size || 0,
       data.file_type || null, data.description || null, data.expiry_date || null, data.uploaded_by || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id, { module_type, category, page = 1, limit = 50 } = {}) {
    let query = 'SELECT * FROM documents WHERE company_id = ?';
    const params = [company_id];
    if (module_type) { query += ' AND module_type = ?'; params.push(module_type); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async getExpiring(company_id, days = 30) {
    const [rows] = await pool.execute(
      `SELECT * FROM documents WHERE company_id = ? AND expiry_date IS NOT NULL
       AND expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
       ORDER BY expiry_date`, [company_id, days]
    );
    return rows;
  },

  async delete(id) {
    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);
    return true;
  }
};

const auditLogModel = {
  async create(data) {
    await pool.execute(
      `INSERT INTO audit_logs (company_id, user_id, action, module, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id || null, data.user_id || null, data.action, data.module || null,
       data.record_id || null, data.old_values || null, data.new_values || null,
       data.ip_address || null, data.user_agent || null]
    );
  },

  async findByCompany(company_id, { module, user_id, page = 1, limit = 100 } = {}) {
    let query = 'SELECT al.*, u.full_name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE al.company_id = ?';
    const params = [company_id];
    if (module) { query += ' AND al.module = ?'; params.push(module); }
    if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY al.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    return rows;
  }
};

const reminderModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO reminders (company_id, user_id, module_type, module_id, title, message, remind_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.user_id, data.module_type, data.module_id, data.title, data.message || null, data.remind_at]
    );
    return result.insertId;
  },

  async findByUser(user_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM reminders WHERE user_id = ? AND is_sent = 0 ORDER BY remind_at', [user_id]
    );
    return rows;
  },

  async getDue() {
    const [rows] = await pool.execute(
      'SELECT * FROM reminders WHERE is_sent = 0 AND remind_at <= NOW()'
    );
    return rows;
  },

  async markSent(id) {
    await pool.execute('UPDATE reminders SET is_sent = 1 WHERE id = ?', [id]);
  },

  async delete(id) {
    await pool.execute('DELETE FROM reminders WHERE id = ?', [id]);
    return true;
  }
};

module.exports = { knowledgeBaseModel, slaModel, notificationModel, messageTemplateModel, documentModel, auditLogModel, reminderModel };
