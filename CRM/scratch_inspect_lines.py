import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');
const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');
console.log('Total lines:', lines.length);
for (const idx of [69, 70, 71, 72, 73, 74]) {
  if (idx < lines.length) {
    console.log(`--- Line ${idx} (len: ${lines[idx].length}) ---`);
    console.log(lines[idx].substring(0, 300));
  }
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_line_headers.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/inspect_line_headers.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

