const mysql = require('C:/Users/supri/Desktop/Ramesh Babu crm/backend/node_modules/mysql2/promise');
const bcrypt = require('C:/Users/supri/Desktop/Ramesh Babu crm/backend/node_modules/bcryptjs');

async function run() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'crm_db', port: 3306 });
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashPass = await bcrypt.hash('Password123', 10);
  await conn.execute("UPDATE users SET password_hash = ? WHERE email = 'admin@saampark.in'", [hashAdmin]);
  await conn.execute("UPDATE users SET password_hash = ? WHERE email = 'team@saampark.in'", [hashPass]);
  await conn.execute("UPDATE users SET password_hash = ? WHERE email = 'client@saampark.in'", [hashPass]);
  console.log('Password hashes updated in users table successfully');
  await conn.end();
}

run().catch(console.error);
