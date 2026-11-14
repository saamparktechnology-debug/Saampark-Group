import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

script = """
const pool = require('/var/www/Saampark-Group/CRM/backend/src/config/db');
const { execSync } = require('child_process');
const fs = require('fs');

async function test() {
  try {
    // 1. Check deleted_items in crm_db
    const [delRows] = await pool.execute('SELECT * FROM deleted_items WHERE module_key LIKE "%lead%" OR item_id LIKE "%lead%"');
    console.log('Deleted items matching leads count:', delRows.length);
    if (delRows.length > 0) {
      console.log('Sample deleted_items for leads:', delRows.slice(0, 10));
    }
    const [allDel] = await pool.execute('SELECT module_key, COUNT(*) as cnt FROM deleted_items GROUP BY module_key');
    console.log('deleted_items by module_key:', allDel);

    // 2. Check /root/crm_db_backup_before_refresh_20261103.sql for leads
    console.log('\\nChecking /root/crm_db_backup_before_refresh_20261103.sql:');
    try {
      const grepLeads = execSync('grep -i "leads" /root/crm_db_backup_before_refresh_20261103.sql | head -n 30').toString();
      console.log('Grep leads in 20261103 backup (first 1000 chars):\\n', grepLeads.slice(0, 1000));
    } catch(e) { console.log('Grep error:', e.message); }

    // 3. Check /root/crm_backup_2026-08-24_222134.sql for leads
    console.log('\\nChecking /root/crm_backup_2026-08-24_222134.sql:');
    try {
      const grepOld = execSync('grep -i "leads" /root/crm_backup_2026-08-24_222134.sql | head -n 10').toString();
      console.log('Grep leads in 2026-08 backup:\\n', grepOld.slice(0, 500));
    } catch(e) {}

    // 4. Also grep in /root for any file containing "350" or lead names
    try {
      const findFiles = execSync('ls -lh /root/*.sql').toString();
      console.log('\\nFiles in /root/*.sql:\\n', findFiles);
    } catch(e) {}

    // 5. Check if there are other backups or json files in /var/www/Saampark-Group/CRM
    try {
      const findCrm = execSync('find /var/www/Saampark-Group/CRM -name "*.json" -o -name "*backup*" -o -name "*.sql"').toString();
      console.log('\\nFiles in CRM dir:\\n', findCrm);
    } catch(e) {}

  } finally {
    process.exit(0);
  }
}
test();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_leads_backups.js', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/inspect_leads_backups.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

