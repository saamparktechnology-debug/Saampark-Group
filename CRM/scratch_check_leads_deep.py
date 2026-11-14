import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

script = """
const pool = require('/var/www/Saampark-Group/CRM/backend/src/config/db');
const { execSync } = require('child_process');

async function test() {
  try {
    const [dbs] = await pool.execute('SHOW DATABASES');
    console.log('DATABASES:', dbs.map(d => Object.values(d)[0]));

    try {
      const [dItems] = await pool.execute('SELECT COUNT(*) as cnt FROM deleted_items');
      console.log('deleted_items count:', dItems[0].cnt);
    } catch(e) { console.log('deleted_items error:', e.message); }

    for (const d of dbs) {
      const dbName = Object.values(d)[0];
      if (['information_schema', 'performance_schema', 'sys', 'mysql'].includes(dbName)) continue;
      try {
        const [tables] = await pool.execute("SHOW TABLES FROM `" + dbName + "`");
        const tNames = tables.map(t => Object.values(t)[0]);
        const matched = tNames.filter(t => t.includes('lead') || t.includes('app_data') || t.includes('crm'));
        if (matched.length > 0) {
          console.log("DB " + dbName + " matched tables:", matched);
        }
        if (tNames.includes('leads')) {
          const [cnt] = await pool.execute("SELECT COUNT(*) as cnt FROM `" + dbName + "`.leads");
          if (cnt[0].cnt > 0) {
            console.log("  -> " + dbName + ".leads count:", cnt[0].cnt);
          }
        }
        if (tNames.includes('app_data')) {
          const [rows] = await pool.execute("SELECT module_key, LENGTH(data_json) as len, updated_at FROM `" + dbName + "`.app_data WHERE module_key LIKE '%lead%'");
          if (rows.length > 0) {
            console.log("  -> " + dbName + ".app_data lead keys:", rows);
          }
        }
      } catch(err) {
        console.log("Error checking db " + dbName + ":", err.message);
      }
    }

    console.log('\\nSearching for sql backups on VPS...');
    try {
      const findSql = execSync('find / -name "*.sql" -o -name "*.sql.gz" 2>/dev/null | grep -v "/proc" | grep -v "/sys" | head -n 40').toString();
      console.log('Found SQL files:\\n', findSql);
    } catch(e) { console.log('find error:', e.message); }

    try {
      const [binlogs] = await pool.execute('SHOW BINARY LOGS');
      console.log('Binary logs count:', binlogs.length, binlogs.slice(0, 5));
    } catch(e) { console.log('Binlog error:', e.message); }

  } finally {
    process.exit(0);
  }
}
test();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_leads_deep.js', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/check_leads_deep.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()
