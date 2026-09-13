const pool = require('../config/db');

const teamModel = {
  async create({ company_id, branch_id, department_id, name, description, lead_id }) {
    const [result] = await pool.execute(
      `INSERT INTO teams (company_id, branch_id, department_id, name, description, lead_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [company_id, branch_id || null, department_id || null, name, description || null, lead_id || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT t.*, u.full_name as lead_name, d.name as department_name
       FROM teams t
       LEFT JOIN users u ON t.lead_id = u.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT t.*, u.full_name as lead_name,
       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
       FROM teams t LEFT JOIN users u ON t.lead_id = u.id
       WHERE t.company_id = ? ORDER BY t.name`, [company_id]
    );
    return rows;
  },

  async addMember(team_id, user_id, role_in_team = 'member') {
    await pool.execute(
      'INSERT INTO team_members (team_id, user_id, role_in_team) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_in_team = ?',
      [team_id, user_id, role_in_team, role_in_team]
    );
  },

  async removeMember(team_id, user_id) {
    await pool.execute('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [team_id, user_id]);
  },

  async getMembers(team_id) {
    const [rows] = await pool.execute(
      `SELECT tm.*, u.full_name, u.email, u.avatar_url
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?`, [team_id]
    );
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM teams WHERE id = ?', [id]);
    return true;
  }
};

module.exports = teamModel;
