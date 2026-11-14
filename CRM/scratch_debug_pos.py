import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');

const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');
const line = lines[72];

const prefix = ",'leads_tech','";
const startIdx = line.indexOf(prefix);
const lastQuoteComma = line.lastIndexOf("','");

const jsonString = line.substring(startIdx + prefix.length, lastQuoteComma);

// Python or MySQL unescaping:
// Let's print around position 25157
console.log('Around 25157:');
console.log(JSON.stringify(jsonString.substring(25130, 25180)));
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/debug_pos.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/debug_pos.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

