import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });

  const [tables] = await conn.execute('SHOW TABLES');
  console.log('--- Tables with rows in crm_db ---');
  for (const t of tables) {
    const tbl = Object.values(t)[0];
    try {
      const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM `' + tbl + '`');
      if (cnt[0].c > 0) {
        console.log(`  ${tbl}: ${cnt[0].c} rows`);
      }
    } catch(e) {}
  }

  console.log('\\n--- app_data keys in crm_db ---');
  const [appKeys] = await conn.execute('SELECT module_key, LENGTH(data_json) as l, updated_at FROM app_data ORDER BY l DESC');
  for (const k of appKeys) {
    console.log(`  ${k.module_key}: ${k.l} bytes (${k.updated_at})`);
  }

  await conn.end();
}
run();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_all_tables.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/inspect_all_tables.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

