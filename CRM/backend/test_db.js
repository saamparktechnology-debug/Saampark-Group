const mysql = require('./node_modules/mysql2/promise');

async function testConnection() {
  const passwords = ['', 'root', 'admin', '123456', 'Ramesh@0329', 'root1234', 'mysql'];
  for (const p of passwords) {
    try {
      const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: p });
      console.log(`✅ SUCCESS with root password: "${p}"`);
      const [dbs] = await conn.query('SHOW DATABASES');
      console.log('Databases:', dbs.map(d => d.Database));
      await conn.end();
      return p;
    } catch (err) {
      console.log(`❌ Failed for password "${p}": ${err.message}`);
    }
  }
  console.log('None of the passwords matched for root user.');
}

testConnection();
