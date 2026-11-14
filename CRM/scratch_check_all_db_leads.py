import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function checkAllDatabases() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123'
  });

  const [dbs] = await conn.execute('SHOW DATABASES');
  for (const d of dbs) {
    const dbName = Object.values(d)[0];
    if (['information_schema', 'performance_schema', 'sys', 'mysql'].includes(dbName)) continue;
    
    // Check tables in db
    try {
      const [tables] = await conn.execute('SHOW TABLES FROM `' + dbName + '`');
      for (const t of tables) {
        const tblName = Object.values(t)[0];
        if (tblName.toLowerCase().includes('lead') || tblName.toLowerCase() === 'app_data') {
          const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM `' + dbName + '`.`' + tblName + '`');
          console.log(`DB ${dbName} -> Table ${tblName}: ${cnt[0].c} rows`);
          
          if (tblName === 'app_data') {
            const [keys] = await conn.execute('SELECT module_key, LENGTH(data_json) as l FROM `' + dbName + '`.app_data WHERE module_key LIKE "%lead%"');
            for (const k of keys) {
              console.log(`   -> key ${k.module_key} (${k.l} bytes)`);
            }
          }
        }
      }
    } catch(err) {
      console.log(`Error on DB ${dbName}:`, err.message);
    }
  }

  await conn.end();
}
checkAllDatabases();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_all_db_leads.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/check_all_db_leads.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

