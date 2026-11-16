const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'saampark_crm',
    port: process.env.DB_PORT || 3306
  });

  try {
    const [rows] = await pool.execute('SELECT id, invoice_number, client_name, total_amount, branch_id, company_id, status FROM invoices');
    console.log('Invoices count:', rows.length);
    console.log(JSON.stringify(rows, null, 2));

    const [appData] = await pool.execute('SELECT module_key, LENGTH(data_json) as len FROM app_data WHERE module_key LIKE ?', ['%invoice%']);
    console.log('AppData invoices keys:', appData);
  } catch(e) {
    console.error('DB Error:', e.message);
  } finally {
    await pool.end();
  }
}
run();

