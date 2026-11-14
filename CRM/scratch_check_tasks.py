import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function checkTasks() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });

  const [rows] = await conn.execute('SELECT module_key, data_json FROM app_data WHERE module_key = "tasks"');
  if (rows.length > 0) {
    const tasks = JSON.parse(rows[0].data_json);
    console.log(`Total tasks in 'tasks': ${tasks.length}`);
    const leadTasks = tasks.filter(t => t.id && t.id.startsWith('lead_task_'));
    console.log(`Tasks created from leads (lead_task_*): ${leadTasks.length}`);
  }

  await conn.end();
}
checkTasks();
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_tasks_leads.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/check_tasks_leads.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

