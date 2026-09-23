const mysql = require('C:/Users/supri/Desktop/Ramesh Babu crm/backend/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_db',
    port: 3306
  });

  const [appUsers] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'users'");
  if (appUsers.length > 0) {
    const list = JSON.parse(appUsers[0].data_json);
    console.log('--- App Data Users count:', list.length);
    list.forEach(u => console.log('User:', u.email, '|', u.name, '|', u.role, '| comp:', u.companyId, '| compIds:', u.companyIds, '| branch:', u.branchId, u.branchName));
  } else {
    console.log('No users in app_data');
  }

  const [tblUsers] = await conn.execute("SELECT id, email, role, role_id, company_id, company_ids FROM users");
  console.log('--- Users table count:', tblUsers.length);
  tblUsers.forEach(u => console.log('TblUser:', u.id, '|', u.email, '|', u.role, '|', u.role_id, '| comp_id:', u.company_id, '| comp_ids:', u.company_ids));

  await conn.end();
}

main().catch(console.error);
