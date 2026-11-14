/**
 * SAAMPARK CRM - Database Export for Production Deployment
 * Run this script BEFORE deploying to your domain.
 * It exports all current data from your local MySQL into a JSON file
 * that you can import on the production server.
 *
 * Usage: node export-db-for-production.js
 */

const mysql = require('./backend/src_extracted/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm_db',
  port: 3306,
};

// All tables to export
const TABLES = [
  'users',
  'companies',
  'roles',
  'leads',
  'tasks',
  'projects',
  'tickets',
  'ticket_replies',
  'ticket_comments',
  'app_data',
  'deleted_items',
  'deals',
  'campaigns',
  'customers',
  'customer_subscriptions',
  'subscription_packages',
  'subscription_invoices',
  'communication_logs',
  'activity_logs',
  'lead_sources',
];

async function exportDatabase() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('? Connected to local MySQL database:', DB_CONFIG.database);

  const exportData = {
    exportedAt: new Date().toISOString(),
    database: DB_CONFIG.database,
    tables: {}
  };

  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const [rows] = await conn.query('SELECT * FROM ??', [table]);
      exportData.tables[table] = rows;
      totalRows += rows.length;
      console.log(  ? :  rows);
    } catch (err) {
      console.warn(  ??  : skipped ());
      exportData.tables[table] = [];
    }
  }

  await conn.end();

  const outputFile = path.join(__dirname, 'crm-db-export.json');
  fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
  console.log('\n?? Export complete!');
  console.log('?? Total rows exported:', totalRows);
  console.log('?? Saved to:', outputFile);
  console.log('\nNext steps:');
  console.log('  1. Upload crm-db-export.json to your production server');
  console.log('  2. Run: node import-db-for-production.js');
}

exportDatabase().catch(err => {
  console.error('? Export failed:', err.message);
  process.exit(1);
});
