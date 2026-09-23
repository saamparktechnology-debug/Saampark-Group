const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  const dumpDir = path.join(__dirname, '..', 'dump_extracted', 'Dump20260814');
  console.log('Reading dump directory:', dumpDir);

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  try {
    console.log('Creating database crm_db if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE crm_db;');

    const files = fs.readdirSync(dumpDir).filter(f => f.endsWith('.sql'));
    console.log(`Found ${files.length} SQL dump files to import.`);

    for (const file of files) {
      const filePath = path.join(dumpDir, file);
      console.log(`Importing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      if (sql.trim()) {
        await connection.query(sql);
      }
    }

    console.log('✅ ALL DATABASE DUMP FILES IMPORTED SUCCESSFULLY!');

    // Show imported tables and counts
    const [tables] = await connection.query('SHOW TABLES;');
    console.log('Imported Tables:', tables.map(t => Object.values(t)[0]));

  } catch (err) {
    console.error('❌ Error during database import:', err.message);
  } finally {
    await connection.end();
  }
}

importDatabase();
