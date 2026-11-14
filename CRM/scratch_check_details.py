import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });

  console.log('=== CHECKING BACKUP TABLES FOR CLIENTS & INVOICES ===');
  for (const bkp of ['app_data_backup_before_lead_restore', 'app_data_safety_backup']) {
    try {
      const [rows] = await conn.execute('SELECT module_key, LENGTH(data_json) as l FROM ' + bkp + ' WHERE module_key LIKE "%client%" OR module_key LIKE "%invoice%"');
      console.log('From ' + bkp + ':');
      for (const r of rows) {
        console.log('  ' + r.module_key + ': ' + r.l + ' bytes');
      }
    } catch (e) {
      console.log('Error checking ' + bkp + ':', e.message);
    }
  }

  console.log('=== CHECKING ALL TABLES FOR CLIENT / INVOICE KEYWORDS ===');
  const [tables] = await conn.execute('SHOW TABLES');
  for (const t of tables) {
    const tbl = Object.values(t)[0];
    if (tbl.includes('client') || tbl.includes('invoice') || tbl.includes('customer')) {
      const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM `' + tbl + '`');
      console.log(`  Table ${tbl}: ${cnt[0].c} rows`);
    }
  }

  console.log('=== CHECKING DELETED ITEMS ===');
  try {
    const [delRows] = await conn.execute('SELECT module_name, COUNT(*) as cnt FROM deleted_items GROUP BY module_name');
    console.log(delRows);
    const [sampleDel] = await conn.execute('SELECT * FROM deleted_items ORDER BY id DESC LIMIT 20');
    console.log('Recent 20 deleted_items:', sampleDel);
  } catch (e) {
    console.log('Error checking deleted_items:', e.message);
  }

  console.log('=== CHECKING COMPANIES TABLE SCHEMA ===');
  const [compCols] = await conn.execute('SHOW COLUMNS FROM companies');
  const logoCol = compCols.find(c => c.Field === 'logo_url');
  console.log('companies.logo_url:', logoCol);

  console.log('=== CHECKING BRANCHES TABLE SCHEMA ===');
  const [brCols] = await conn.execute('SHOW COLUMNS FROM branches');
  const brLogoCol = brCols.find(c => c.Field === 'logo_url');
  const brUpdCol = brCols.find(c => c.Field === 'updated_at');
  console.log('branches.logo_url:', brLogoCol);
  console.log('branches.updated_at:', brUpdCol);

  await conn.end();
}
run();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_details.js', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('node /tmp/check_details.js', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
ssh.close()

