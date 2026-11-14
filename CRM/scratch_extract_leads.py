import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

# Write script directly with node.js to avoid python escaping issues
node_script = """
const fs = require('fs');

const filename = '/root/crm_db_backup_before_refresh_20261103.sql';
console.log('Reading ' + filename + '...');

const content = fs.readFileSync(filename, 'utf-8');
const lines = content.split('\\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('app_data') && line.includes('leads')) {
    console.log(`Line ${i}: length ${line.length}`);
    
    // Extract insert tuples
    // Each tuple is ('key', 'data_json', 'timestamp')
    // We look for ('leads...'
    const regex = /\\('([^']+)',\\s*'(\\[.*?\\])',\\s*'([^']+)'\\)/g;
    let match;
    let foundCount = 0;
    while ((match = regex.exec(line)) !== null) {
      const key = match[1];
      const rawJson = match[2];
      foundCount++;
      try {
        // Unescape MySQL: \\' -> ', \\" -> ", \\\\ -> \\
        const unescaped = rawJson.replace(/\\\\'/g, "'").replace(/\\\\"/g, '"').replace(/\\\\\\\\/g, '\\\\').replace(/\\\\r/g, '\\r').replace(/\\\\n/g, '\\n');
        const parsed = JSON.parse(unescaped);
        console.log(`SUCCESS parsed key '${key}': ${parsed.length} items!`);
        fs.writeFileSync(`/tmp/backup_leads_${key}.json`, JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(`Failed to parse key '${key}': ${e.message}`);
        // Count approximate objects
        const idMatches = rawJson.match(/"id":/g);
        console.log(`Regex count of "id": in '${key}': ${idMatches ? idMatches.length : 0}`);
      }
    }
    if (foundCount === 0) {
      // Manual substring extraction
      console.log('Regex did not match whole tuple, trying substring search...');
      for (const k of ['leads', 'leads_tech', 'leads_saampark', 'leads_consultancy']) {
        const marker = `('${k}','`;
        const idx = line.indexOf(marker);
        if (idx !== -1) {
          console.log(`Found marker ${marker} at pos ${idx}`);
          // Find the closing of this value
          const after = line.substring(idx + marker.length);
          // Look for closing of JSON array: ]'
          const endBracket = after.indexOf("]'");
          if (endBracket !== -1) {
            const rawJson = after.substring(0, endBracket + 1);
            console.log(`Raw json length for ${k}: ${rawJson.length}`);
            const idMatches = rawJson.match(/"id":/g);
            console.log(`Approximate leads count in ${k}: ${idMatches ? idMatches.length : 0}`);
            try {
              const unescaped = rawJson.replace(/\\\\'/g, "'").replace(/\\\\"/g, '"').replace(/\\\\\\\\/g, '\\\\').replace(/\\\\r/g, '\\r').replace(/\\\\n/g, '\\n');
              const parsed = JSON.parse(unescaped);
              console.log(`SUCCESSFULLY PARSED ${k}: ${parsed.length} LEADS!`);
              fs.writeFileSync(`/tmp/backup_leads_${k}.json`, JSON.stringify(parsed, null, 2));
            } catch (err) {
              console.log(`Parse error for ${k}: ${err.message}`);
              fs.writeFileSync(`/tmp/raw_${k}.txt`, rawJson);
            }
          }
        }
      }
    }
  }
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/extract_backup_leads.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/extract_backup_leads.js", timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()
