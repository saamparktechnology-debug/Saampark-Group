import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

script = """
const pool = require('/var/www/Saampark-Group/CRM/backend/src/config/db');
async function test() {
  try {
    try {
      const [tableLeads] = await pool.execute('SELECT COUNT(*) as cnt FROM leads');
      console.log('TABLE leads count:', tableLeads[0].cnt);
    } catch(e) { console.log('TABLE leads error:', e.message); }

    try {
      const [appDataRows] = await pool.execute('SELECT module_key, LENGTH(data_json) as len, updated_at FROM app_data WHERE module_key LIKE "%lead%"');
      console.log('APP_DATA lead rows:', appDataRows);
    } catch(e) { console.log('APP_DATA error:', e.message); }

    try {
      const [rows] = await pool.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%lead%"');
      for (const r of rows) {
        try {
          const parsed = JSON.parse(r.data_json);
          console.log(`Key ${r.module_key}: ${Array.isArray(parsed) ? parsed.length : typeof parsed} items`);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const compCounts = {};
            const branchCounts = {};
            for (const l of parsed) {
              const cid = l.companyId || l.company_id || 'none';
              const bid = l.branchId || l.branch || 'none';
              compCounts[cid] = (compCounts[cid] || 0) + 1;
              branchCounts[bid] = (branchCounts[bid] || 0) + 1;
            }
            console.log(`  Breakdown by companyId for ${r.module_key}:`, JSON.stringify(compCounts));
            console.log(`  Breakdown by branchId for ${r.module_key}:`, JSON.stringify(branchCounts));
          }
        } catch(err) {
          console.log(`Key ${r.module_key} parse error:`, err.message);
        }
      }
    } catch(e) { console.log('Parse error:', e.message); }

    try {
      const [delRows] = await pool.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%deleted%"');
      for (const r of delRows) {
        const parsed = JSON.parse(r.data_json);
        console.log(`Deleted key ${r.module_key}: ${Array.isArray(parsed) ? parsed.length : typeof parsed} items`);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`  Sample deleted ids for ${r.module_key}:`, parsed.slice(0, 10));
        }
      }
    } catch(e) {}

    // Check all tables in DB
    try {
      const [tables] = await pool.execute('SHOW TABLES');
      console.log('All DB tables:', tables.map(t => Object.values(t)[0]));
    } catch(e) {}

    // Check backups in filesystem
    const fs = require('fs');
    console.log('Checking /var/www backups...');
    try {
      const files = fs.readdirSync('/var/www');
      console.log('/var/www entries:', files);
    } catch(e) {}

  } finally {
    process.exit(0);
  }
}
test();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_leads.js', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/check_leads.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

