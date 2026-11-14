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

  const [rows] = await conn.execute('SELECT * FROM deleted_items');
  console.log('All 76 deleted items:');
  const byModule = {};
  for (const r of rows) {
    byModule[r.module_name] = (byModule[r.module_name] || 0) + 1;
    console.log(`  id: ${r.item_id}, mod: ${r.module_name}, deleted_at: ${r.deleted_at}`);
  }
  console.log('Summary by module:', byModule);

  await conn.end();
}
run();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_deleted.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/inspect_deleted.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

