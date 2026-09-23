/**
 * ensure_db.js — safe, idempotent database bootstrapper.
 *
 * Unlike import_db.js (which blindly re-runs the dump files — each contains
 * `DROP TABLE IF EXISTS`, so re-running it WIPES any data you have entered),
 * this script only imports the dump when the database is genuinely empty.
 *
 * It also reads credentials from .env instead of hard-coding them, so a single
 * place (.env) controls the MySQL password for every script.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_NAME = process.env.DB_NAME || 'crm_db';

async function main() {
  const conf = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  };

  let conn;
  try {
    conn = await mysql.createConnection(conf);
    console.log(`Connected to MySQL at ${conf.host}:${conf.port} as "${conf.user}".`);
  } catch (e) {
    console.error('\n[FATAL] Could not connect to MySQL.');
    console.error('        ' + e.message + '\n');
    if (/ECONNREFUSED/i.test(e.message)) {
      console.error('  Cause: nothing is listening on ' + conf.host + ':' + conf.port + '.');
      console.error('  Fix  : open the XAMPP Control Panel and press Start next to "MySQL".');
    } else if (/Access denied/i.test(e.message)) {
      console.error('  Cause: MySQL rejected the password for user "' + conf.user + '".');
      console.error('  Fix  : open backend/src_extracted/.env and set DB_PASSWORD to your');
      console.error('         real MySQL root password (leave it blank for a default XAMPP).');
      console.error('  Tip  : run "node test_db.js" to discover which password works.');
    }
    process.exit(1);
  }

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.query(`USE \`${DB_NAME}\`;`);

  const [tables] = await conn.query('SHOW TABLES;');
  const names = tables.map((t) => Object.values(t)[0]);

  if (names.includes('users')) {
    console.log(
      `Database "${DB_NAME}" is already initialised (${names.length} tables).\n` +
      'Skipping dump import so your existing data is preserved.'
    );
  } else {
    const dumpDir = path.join(__dirname, '..', 'dump_extracted', 'Dump20260814');
    if (!fs.existsSync(dumpDir)) {
      console.error('[FATAL] Dump folder not found: ' + dumpDir);
      process.exit(1);
    }
    const files = fs.readdirSync(dumpDir).filter((f) => f.endsWith('.sql')).sort();
    console.log(`Empty database detected — importing ${files.length} dump files...`);
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dumpDir, f), 'utf-8');
      if (sql.trim()) {
        await conn.query(sql);
        console.log('  imported ' + f);
      }
    }
    console.log('Dump import complete.');
  }

  await conn.end();
  console.log('Database ready.');
}

main().catch((e) => {
  console.error('ensure_db error:', e.message);
  process.exit(1);
});
