import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'temp_restore'
  });

  const [rows] = await conn.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%lead%"');
  for (const r of rows) {
    try {
      const data = JSON.parse(r.data_json);
      console.log(`temp_restore key '${r.module_key}': ${data.length} items`);
    } catch(e) {
      console.log(`Error parsing ${r.module_key}:`, e.message);
    }
  }

  await conn.end();
}
check();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_temp_counts.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/check_temp_counts.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()
