import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');

console.log('Extracting all leads from lines 69, 72, and 74...');
const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
const lines = content.split('\\n');

const allLeadsMap = new Map();

for (const lineIdx of [69, 72, 74]) {
  const line = lines[lineIdx];
  // Extract all JSON objects: {\\\"type\\\":...} or {\\\"id\\\":...}
  // Let's unescape this line
  let unescaped = line
    .replace(/\\\\\"/g, '"')
    .replace(/\\\\'/g, "'")
    .replace(/\\\\r/g, '\\r')
    .replace(/\\\\n/g, '\\n')
    .replace(/\\\\t/g, '\\t')
    .replace(/\\\\\\\\/g, '\\\\');

  // Find all JSON array brackets: [ { ... } ]
  const firstBracket = unescaped.indexOf('[');
  const lastBracket = unescaped.lastIndexOf(']');

  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const arrayStr = unescaped.substring(firstBracket, lastBracket + 1);
    try {
      const arr = JSON.parse(arrayStr);
      console.log(`Line ${lineIdx} parsed directly as JSON array with ${arr.length} leads!`);
      for (const item of arr) {
        if (item && (item.name || item.id || item.phone)) {
          // Identify unique lead: key by unique identifier
          // Use ID if available, otherwise name + phone
          const uniqueKey = item.id ? String(item.id).trim() : `${item.name || ''}_${item.phone || ''}`.trim();
          if (uniqueKey && !allLeadsMap.has(uniqueKey)) {
            allLeadsMap.set(uniqueKey, item);
          }
        }
      }
    } catch(err) {
      console.log(`Line ${lineIdx} array JSON parse error: ${err.message}. Extracting object by object...`);
      // Regex extract each object { ... }
      const objMatches = arrayStr.match(/\\{[^{}]*?\\}/g);
      console.log(`Found ${objMatches ? objMatches.length : 0} objects via regex`);
      if (objMatches) {
        for (const o of objMatches) {
          try {
            const item = JSON.parse(o);
            const uniqueKey = item.id ? String(item.id).trim() : `${item.name || ''}_${item.phone || ''}`.trim();
            if (uniqueKey && !allLeadsMap.has(uniqueKey)) {
              allLeadsMap.set(uniqueKey, item);
            }
          } catch(e) {}
        }
      }
    }
  }
}

console.log(`\\n>>> TOTAL UNIQUE LEADS EXTRACTED: ${allLeadsMap.size} LEADS!`);
const allRecovered = Array.from(allLeadsMap.values());
fs.writeFileSync('/root/all_recovered_350_leads.json', JSON.stringify(allRecovered, null, 2));
console.log('Saved to /root/all_recovered_350_leads.json');
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/extract_all_unique.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/extract_all_unique.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

