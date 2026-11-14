import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');

const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');
const line = lines[72];

console.log('Line 72 start (first 100 chars):');
console.log(JSON.stringify(line.substring(0, 100)));

console.log('Line 72 end (last 100 chars):');
console.log(JSON.stringify(line.substring(line.length - 100)));
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/debug_line72_chars.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/debug_line72_chars.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

