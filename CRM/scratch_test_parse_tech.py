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
console.log('JSON substring length:', jsonString.length);

// In MySQL dump, quotes inside string are escaped with \\\" or \\'
// Let's unescape
const unescaped = jsonString
  .replace(/\\\\\"/g, '"')
  .replace(/\\\\'/g, "'")
  .replace(/\\\\r/g, '\\r')
  .replace(/\\\\n/g, '\\n')
  .replace(/\\\\t/g, '\\t')
  .replace(/\\\\\\\\/g, '\\\\');

try {
  const data = JSON.parse(unescaped);
  console.log(`>>> TOTAL RECOVERED LEADS IN LINE 72: ${data.length} LEADS!`);
  fs.writeFileSync('/tmp/recovered_leads_tech.json', JSON.stringify(data));
  console.log('Sample recovered lead 0:', data[0].name, data[0].phone);
  console.log('Sample recovered lead 100:', data[100]?.name, data[100]?.phone);
  console.log('Sample recovered lead 200:', data[200]?.name, data[200]?.phone);
  console.log('Sample recovered lead 300:', data[300]?.name, data[300]?.phone);
} catch (e) {
  console.log('Parse error:', e.message);
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_parse_tech.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/test_parse_tech.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

