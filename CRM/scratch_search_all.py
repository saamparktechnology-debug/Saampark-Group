import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');
const { execSync } = require('child_process');

async function searchAll() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123'
  });

  const [dbs] = await conn.execute('SHOW DATABASES');
  for (const d of dbs) {
    const db = Object.values(d)[0];
    if (['information_schema', 'performance_schema', 'sys', 'mysql'].includes(db)) continue;
    try {
      const [tables] = await conn.execute(`SHOW TABLES FROM \\\`${db}\\\``);
      for (const t of tables) {
        const tbl = Object.values(t)[0];
        try {
          const [cnt] = await conn.execute(`SELECT COUNT(*) as c FROM \\\`${db}\\\`.\\\`${tbl}\\\``);
          if (tbl.includes('lead')) {
            console.log(`FOUND TABLE: ${db}.${tbl} with ${cnt[0].c} rows!`);
          }
          if (tbl === 'app_data') {
            const [rows] = await conn.execute(`SELECT module_key, LENGTH(data_json) as l FROM \\\`${db}\\\`.app_data WHERE module_key LIKE '%lead%'`);
            if (rows.length > 0) {
              console.log(`FOUND APP_DATA in ${db}:`, rows);
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
  }
  await conn.end();

  // Search for any csv or json files mentioning leads in /var/www or /root
  console.log('\\nSearching for files with 300+ leads or keywords...');
  try {
    const grepRes = execSync('grep -r -l "reminderNotes" /var/www/Saampark-Group/ /root/ 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v ".next" | head -n 30').toString();
    console.log('Files with reminderNotes:\\n', grepRes);
  } catch(e) {
    console.log('grep error:', e.message);
  }
}
searchAll();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/search_all_databases.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/search_all_databases.js", timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

