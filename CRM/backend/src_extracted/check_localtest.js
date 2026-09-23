const mysql = require('./node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_db',
    port: 3306
  });

  const [tbl] = await conn.execute("SELECT id, email, full_name, role_id, company_id, branch_id FROM users WHERE email LIKE '%localtestuser%'");
  console.log('TblUser in MySQL users table:', tbl);

  const [app] = await conn.execute("SELECT module_key, data_json FROM app_data WHERE module_key = 'users'");
  if (app.length > 0) {
    const list = JSON.parse(app[0].data_json);
    const found = list.filter(u => u.email && u.email.includes('localtestuser'));
    console.log('Found in app_data:', found);
  }

  await conn.end();
}

main().catch(console.error);
