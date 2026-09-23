const mysql = require('./node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_db',
    port: 3306
  });

  const [tblUsers] = await conn.execute(
    'SELECT id, email, full_name, role_id, company_id, company_ids, branch_id, deleted_at FROM users'
  );
  console.log('--- Users table count:', tblUsers.length);
  tblUsers.forEach(u => console.log('TblUser:', u.id, '|', u.email, '|', u.full_name, '| role_id:', u.role_id, '| comp:', u.company_id, '| comp_ids:', u.company_ids, '| branch:', u.branch_id, '| del:', u.deleted_at));

  const [appUsers] = await conn.execute(
    "SELECT module_key, company_id, data_json FROM app_data WHERE module_key LIKE '%user%'"
  );
  console.log('--- app_data users rows:', appUsers.length);
  appUsers.forEach(r => {
    console.log('app_data row:', r.module_key, 'comp_id:', r.company_id);
    try {
      const list = JSON.parse(r.data_json);
      console.log('  count:', list.length);
      list.forEach(u => console.log('   *', u.id, '|', u.email, '|', u.name, '| role:', u.role, '| comp:', u.companyId, '| compIds:', u.companyIds, '| branch:', u.branchId));
    } catch (e) {
      console.log('  invalid json:', e.message);
    }
  });

  await conn.end();
}

main().catch(console.error);
