const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getSuperAdminStats = async (req, res) => {
  try {
    const getTotal = async (sql, params = []) => {
      try {
        const [rows] = await pool.query(sql, params);
        return rows[0]?.total || 0;
      } catch {
        return 0;
      }
    };

    const totalCompanies = await getTotal('SELECT COUNT(*) as total FROM companies');
    const totalBranches = await getTotal('SELECT COUNT(*) as total FROM branches');
    const totalUsers = await getTotal('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL');
    const totalProjects = await getTotal('SELECT COUNT(*) as total FROM projects');
    const totalRevenue = await getTotal('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices');
    const activeCompanies = await getTotal('SELECT COUNT(*) as total FROM companies WHERE status = "active"');
    const activeUsers = await getTotal('SELECT COUNT(*) as total FROM users WHERE status = "active" AND deleted_at IS NULL');

    let companyWiseBreakdown = [];
    try {
      const [companies] = await pool.query('SELECT id, name FROM companies ORDER BY name');
      for (const company of companies) {
        const branchCount = await getTotal('SELECT COUNT(*) as total FROM branches WHERE company_id = ?', [company.id]);
        const userCount = await getTotal('SELECT COUNT(*) as total FROM users WHERE company_id = ? AND deleted_at IS NULL', [company.id]);
        const projectCount = await getTotal('SELECT COUNT(*) as total FROM projects WHERE company_id = ?', [company.id]);
        const revenue = await getTotal('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE company_id = ?', [company.id]);

        companyWiseBreakdown.push({
          name: company.name,
          branch_count: branchCount,
          user_count: userCount,
          project_count: projectCount,
          revenue
        });
      }
    } catch {
      companyWiseBreakdown = [];
    }

    return successResponse(res, {
      total_companies: totalCompanies,
      total_branches: totalBranches,
      total_users: totalUsers,
      total_projects: totalProjects,
      total_revenue: totalRevenue,
      active_companies: activeCompanies,
      active_users: activeUsers,
      company_wise_breakdown: companyWiseBreakdown
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch super admin stats', error.message);
  }
};

const getRecentActivity = async (req, res) => {
  try {
    let activities = [];

    const safeQuery = async (sql, type) => {
      try {
        const [rows] = await pool.query(sql);
        return rows.map(row => ({
          type,
          data: row,
          created_at: row.created_at || row.login_at || new Date()
        }));
      } catch {
        return [];
      }
    };

    const userActivities = await safeQuery(
      `SELECT id, name, email, created_at, login_at, 'user' as entity_type
       FROM users WHERE deleted_at IS NULL ORDER BY COALESCE(login_at, created_at) DESC LIMIT 5`,
      'user_login'
    );

    const companyActivities = await safeQuery(
      `SELECT id, name, created_at, 'company' as entity_type
       FROM companies ORDER BY created_at DESC LIMIT 5`,
      'new_company'
    );

    const branchActivities = await safeQuery(
      `SELECT id, name, created_at, 'branch' as entity_type
       FROM branches ORDER BY created_at DESC LIMIT 5`,
      'new_branch'
    );

    const taskActivities = await safeQuery(
      `SELECT id, title, created_at, 'task' as entity_type
       FROM tasks ORDER BY created_at DESC LIMIT 5`,
      'new_task'
    );

    const projectActivities = await safeQuery(
      `SELECT id, name, created_at, 'project' as entity_type
       FROM projects ORDER BY created_at DESC LIMIT 5`,
      'new_project'
    );

    activities = [
      ...userActivities,
      ...companyActivities,
      ...branchActivities,
      ...taskActivities,
      ...projectActivities
    ];

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    activities = activities.slice(0, 20);

    return successResponse(res, activities);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch recent activity', error.message);
  }
};

module.exports = { getSuperAdminStats, getRecentActivity };
