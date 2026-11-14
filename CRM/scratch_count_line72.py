import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');
const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');

for (const i of [69, 72, 74]) {
  const line = lines[i];
  const keyMatch = line.match(/'(leads[^']*)'/);
  const key = keyMatch ? keyMatch[1] : 'unknown';
  
  const idMatches = line.match(/\\\\\"id\\\\\":/g) || line.match(/\"id\":/g);
  const nameMatches = line.match(/\\\\\"name\\\\\":/g) || line.match(/\"name\":/g);
  const phoneMatches = line.match(/\\\\\"phone\\\\\":/g) || line.match(/\"phone\":/g);
  
  console.log(`Line ${i} (key: ${key}, bytes: ${line.length}):`);
  console.log(`   id matches: ${idMatches ? idMatches.length : 0}`);
  console.log(`   name matches: ${nameMatches ? nameMatches.length : 0}`);
  console.log(`   phone matches: ${phoneMatches ? phoneMatches.length : 0}`);
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/count_exact_backup.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/count_exact_backup.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()
