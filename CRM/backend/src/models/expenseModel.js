const pool = require('../config/db');

const expenseModel = {
  async findByCompany(companyId, filters = {}) {
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (companyId && companyId !== 'all') {
      query += ' AND company_id = ?';
      params.push(companyId);
    }
    if (filters.branch_id && filters.branch_id !== 'all') {
      query += ' AND (branch_id = ? OR branch_id IS NULL)';
      params.push(filters.branch_id);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.projectId) {
      query += ' AND project_id = ?';
      params.push(filters.projectId);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows.map(r => ({
      id: r.id,
      expenseNumber: r.expense_number,
      title: r.title,
      amount: String(r.amount),
      amountNum: Number(r.amount),
      category: r.category,
      date: r.date ? (r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date)) : '',
      member: r.member || '',
      assignedMemberId: r.assigned_member_id || '',
      projectId: r.project_id || '',
      projectName: r.project_name || '',
      isProjectExpense: Boolean(r.is_project_expense),
      isExtraCharge: Boolean(r.is_extra_charge),
      extraChargeCategory: r.extra_charge_category || '',
      status: r.status,
      receiptUrl: r.receipt_url || '',
      notes: r.notes || '',
      companyId: r.company_id,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      expenseNumber: r.expense_number,
      title: r.title,
      amount: String(r.amount),
      amountNum: Number(r.amount),
      category: r.category,
      date: r.date ? (r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date)) : '',
      member: r.member || '',
      assignedMemberId: r.assigned_member_id || '',
      projectId: r.project_id || '',
      projectName: r.project_name || '',
      isProjectExpense: Boolean(r.is_project_expense),
      isExtraCharge: Boolean(r.is_extra_charge),
      extraChargeCategory: r.extra_charge_category || '',
      status: r.status,
      receiptUrl: r.receipt_url || '',
      notes: r.notes || '',
      companyId: r.company_id,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async create(data) {
    const id = data.id || ('exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    
    // Generate expense number if not provided
    let num = data.expenseNumber || data.expense_number;
    if (!num) {
      const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM expenses WHERE company_id = ?', [data.company_id || 'tech']);
      num = 'EXP-' + new Date().getFullYear() + '-' + String((cnt[0]?.count || 0) + 1).padStart(4, '0');
    }

    const query = `
      INSERT INTO expenses (
        id, company_id, expense_number, title, amount, category, date,
        member, assigned_member_id, project_id, project_name,
        is_project_expense, is_extra_charge, extra_charge_category,
        status, receipt_url, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const amt = parseFloat(data.amountNum ?? data.amount) || 0;
    const dateVal = data.date || new Date().toISOString().split('T')[0];

    await pool.execute(query, [
      id,
      data.company_id || 'tech',
      num,
      data.title || 'Untitled Expense',
      amt,
      data.category || 'General',
      dateVal,
      data.member || '',
      data.assignedMemberId || data.assigned_member_id || null,
      data.projectId || data.project_id || null,
      data.projectName || data.project_name || null,
      data.isProjectExpense ? 1 : 0,
      data.isExtraCharge ? 1 : 0,
      data.extraChargeCategory || null,
      data.status || 'Pending',
      data.receiptUrl || data.receipt_url || null,
      data.notes || null,
      data.created_by || null,
    ]);

    return { id, expenseNumber: num };
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.amount !== undefined || data.amountNum !== undefined) {
      fields.push('amount = ?');
      params.push(parseFloat(data.amountNum ?? data.amount) || 0);
    }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }
    if (data.member !== undefined) { fields.push('member = ?'); params.push(data.member); }
    if (data.assignedMemberId !== undefined) { fields.push('assigned_member_id = ?'); params.push(data.assignedMemberId); }
    if (data.projectId !== undefined) { fields.push('project_id = ?'); params.push(data.projectId); }
    if (data.projectName !== undefined) { fields.push('project_name = ?'); params.push(data.projectName); }
    if (data.isProjectExpense !== undefined) { fields.push('is_project_expense = ?'); params.push(data.isProjectExpense ? 1 : 0); }
    if (data.isExtraCharge !== undefined) { fields.push('is_extra_charge = ?'); params.push(data.isExtraCharge ? 1 : 0); }
    if (data.extraChargeCategory !== undefined) { fields.push('extra_charge_category = ?'); params.push(data.extraChargeCategory); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.receiptUrl !== undefined) { fields.push('receipt_url = ?'); params.push(data.receiptUrl); }
    if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes); }

    if (fields.length === 0) return true;

    params.push(id);
    await pool.execute(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, params);
    return true;
  },

  async updateStatus(id, status) {
    await pool.execute('UPDATE expenses SET status = ? WHERE id = ?', [status, id]);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
    return true;
  },

  async getStats(companyId) {
    let query = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count
      FROM expenses
    `;
    const params = [];
    if (companyId && companyId !== 'all') {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.execute(query, params);
    return rows[0] || {};
  }
};

module.exports = expenseModel;
