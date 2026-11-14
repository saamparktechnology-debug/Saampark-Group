import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function compare() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'temp_restore'
  });

  const [rows] = await conn.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%lead%"');
  const datasets = {};
  for (const r of rows) {
    try {
      datasets[r.module_key] = JSON.parse(r.data_json);
    } catch(e) {}
  }

  const allLeadsMap = new Map();
  for (const [k, list] of Object.entries(datasets)) {
    console.log(`Key ${k} has ${list.length} leads`);
    for (const item of list) {
      if (item && item.id) {
        const idKey = String(item.id).toLowerCase().trim();
        if (!allLeadsMap.has(idKey)) {
          allLeadsMap.set(idKey, { ...item, sourceKey: k });
        }
      }
    }
  }

  console.log(`TOTAL UNIQUE LEADS across all keys in temp_restore: ${allLeadsMap.size}`);

  // Also check crm_db right now:
  const connLive = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });
  const [liveRows] = await connLive.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%lead%"');
  for (const r of liveRows) {
    try {
      const list = JSON.parse(r.data_json);
      console.log(`LIVE crm_db key ${r.module_key} has ${list.length} leads`);
      for (const item of list) {
        if (item && item.id) {
          const idKey = String(item.id).toLowerCase().trim();
          if (!allLeadsMap.has(idKey)) {
            allLeadsMap.set(idKey, { ...item, sourceKey: 'live_' + r.module_key });
          }
        }
      }
    } catch(e) {}
  }

  console.log(`TOTAL COMBINED UNIQUE LEADS across all DBs & keys: ${allLeadsMap.size}`);

  // Also check if any leads were saved in users table or tasks table or activity logs!
  const [actLogs] = await connLive.execute('SELECT COUNT(*) as cnt FROM activity_logs WHERE module = "Leads" OR description LIKE "%lead%"');
  console.log(`Activity logs matching leads: ${actLogs[0].cnt}`);

  await conn.end();
  await connLive.end();
}
compare();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/compare_leads_keys.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/compare_leads_keys.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

