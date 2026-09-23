/**
 * SAAMPARK CRM - Database Import for Production Deployment
 * Run this on your PRODUCTION SERVER after uploading crm-db-export.json.
 *
 * Usage: node import-db-for-production.js
 *
 * Make sure to set correct DB credentials in .env before running.
 */

require('dotenv').config({ path: './backend/src_extracted/.env.production' });

const mysql = require('./backend/src_extracted/node_modules/mysql2/promise');
const fs = require('fs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crm_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true,
};

async function importDatabase() {
  if (!fs.existsSync('crm-db-export.json')) {
    console.error('? crm-db-export.json not found! Run export-db-for-production.js first.');
    process.exit(1);
  }

  const exportData = JSON.parse(fs.readFileSync('crm-db-export.json', 'utf8'));
  console.log('?? Importing data exported at:', exportData.exportedAt);
  console.log('?? Database:', exportData.database);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('? Connected to production MySQL database:', DB_CONFIG.database);

  let totalInserted = 0;

  for (const [table, rows] of Object.entries(exportData.tables)) {
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(  ??  : no data);
      continue;
    }

    try {
      // Clear existing rows for a clean import
      await conn.query('DELETE FROM ??', [table]);

      // Bulk insert in batches of 100
      const cols = Object.keys(rows[0]);
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = batch.map(row => cols.map(c => row[c]));
        await conn.query(
          'INSERT INTO ?? (??) VALUES ?',
          [table, cols, values]
        );
        inserted += batch.length;
      }

      totalInserted += inserted;
      console.log('  ?', table + ':', inserted, 'rows imported');
    } catch (err) {
      console.warn('  ?? ', table, '- skipped:', err.message);
    }
  }

  await conn.end();

  console.log('\n?? Import complete!');
  console.log('? Total rows imported:', totalInserted);
  console.log('\n?? Remember to:');
  console.log('   1. Update backend .env.production with correct credentials');
  console.log('   2. Update frontend .env.production with your API URL');
  console.log('   3. Run: npm run build && npm start in the frontend folder');
}

importDatabase().catch(err => {
  console.error('? Import failed:', err.message);
  process.exit(1);
});
