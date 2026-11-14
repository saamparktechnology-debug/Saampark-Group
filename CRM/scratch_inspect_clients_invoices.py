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

  const [bRows] = await conn.execute('SELECT module_key, data_json FROM app_data_safety_backup WHERE module_key IN ("clients", "clients_tech", "invoices", "invoices_tech")');
  for (const r of bRows) {
    console.log(`=== ${r.module_key} ===`);
    try {
      const data = JSON.parse(r.data_json);
      console.log(`Array length: ${Array.isArray(data) ? data.length : typeof data}`);
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  }

  // Also check companies table contents
  const [comps] = await conn.execute('SELECT id, name, slug, brand_name, division_name FROM companies');
  console.log('=== COMPANIES TABLE ===', comps);

  // Also check branches table contents
  const [branches] = await conn.execute('SELECT id, company_id, name, code, brand_name, division_name FROM branches');
  console.log('=== BRANCHES TABLE ===', branches);

  await conn.end();
}
run();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_clients_invoices.js', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('node /tmp/inspect_clients_invoices.js', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
ssh.close()

