import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');

const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');

function parseLine(lineIndex, label) {
  const line = lines[lineIndex];
  console.log(`=== Processing Line ${lineIndex} (${label}, length: ${line.length}) ===`);
  
  // Format: INSERT INTO `app_data` VALUES (id,'module_key','...data_json...','updated_at');
  // First, find the first occurrence of ,'['
  const startIdx = line.indexOf(",'[{\\\"");
  if (startIdx === -1) {
    console.log('Could not find start of JSON array');
    return null;
  }
  
  // The JSON starts after ,'
  const jsonStart = startIdx + 2;
  
  // The JSON ends before the last ','timestamp');
  const lastQuoteComma = line.lastIndexOf("','");
  if (lastQuoteComma === -1) {
    console.log('Could not find end timestamp separator');
    return null;
  }
  
  const rawJsonEscaped = line.substring(jsonStart, lastQuoteComma);
  console.log('Extracted raw JSON length:', rawJsonEscaped.length);
  
  // Unescape MySQL: \\' -> ', \\" -> ", \\\\ -> \\
  // Note: in mysqldump, single quotes inside strings are escaped with \'
  // and backslashes are escaped with \\
  let unescaped = rawJsonEscaped
    .replace(/\\\\'/g, "'")
    .replace(/\\\\"/g, '"')
    .replace(/\\\\r/g, '\\r')
    .replace(/\\\\n/g, '\\n')
    .replace(/\\\\t/g, '\\t')
    .replace(/\\\\\\\\/g, '\\\\');
    
  try {
    const data = JSON.parse(unescaped);
    console.log(`>>> SUCCESS! Extracted ${data.length} leads from ${label}!`);
    fs.writeFileSync(`/tmp/recovered_${label}.json`, JSON.stringify(data, null, 2));
    
    // Sample stats
    console.log('First lead:', data[0]?.name, data[0]?.phone, data[0]?.companyId);
    console.log('Last lead:', data[data.length - 1]?.name, data[data.length - 1]?.phone, data[data.length - 1]?.companyId);
    return data;
  } catch (err) {
    console.log(`JSON parse error: ${err.message}`);
    // Let's inspect where parse failed
    const pos = err.message.match(/at position (\\d+)/);
    if (pos) {
      const p = parseInt(pos[1]);
      console.log('Context around error:', unescaped.substring(Math.max(0, p - 50), Math.min(unescaped.length, p + 50)));
    }
    return null;
  }
}

const leads69 = parseLine(69, 'leads_line69');
const leadsTech72 = parseLine(72, 'leads_tech_line72');

console.log('\\nSUMMARY:');
console.log('Line 69 count:', leads69 ? leads69.length : 'failed');
console.log('Line 72 (leads_tech) count:', leadsTech72 ? leadsTech72.length : 'failed');

if (leadsTech72) {
  console.log('Total leads found in leads_tech backup:', leadsTech72.length);
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/parse_backup_line72.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/parse_backup_line72.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

