import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

# Perfect sequence-preserving restoration script
restore_script = """
const fs = require('fs');
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');

async function executeFullRestore() {
  console.log('--- Step 1: Connecting to MySQL database ---');
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });

  // Backup existing state
  await conn.execute('CREATE TABLE IF NOT EXISTS app_data_safety_backup AS SELECT * FROM app_data');

  console.log('--- Step 2: Reading original backup SQL file ---');
  const content = fs.readFileSync('/root/crm_db_backup_before_refresh_20261103.sql', 'utf-8');
  const lines = content.split('\\n');

  // We will collect leads in exact sequential order
  const orderedLeads = [];
  const seenIds = new Set();
  const seenNames = new Set();

  function addLeadInOrder(l) {
    if (!l) return;
    const nameStr = (l.name || l.businessName || l.client || '').trim();
    const phoneStr = (l.phone || '').trim();
    const idStr = String(l.id || '').trim();

    if (!nameStr && !phoneStr) return;

    // Check uniqueness by ID or Name
    if (idStr && seenIds.has(idStr.toLowerCase())) return;
    if (nameStr && seenNames.has(nameStr.toLowerCase())) return;

    if (idStr) seenIds.add(idStr.toLowerCase());
    if (nameStr) seenNames.add(nameStr.toLowerCase());

    orderedLeads.push({
      ...l,
      companyId: l.companyId || 'tech',
      id: idStr || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    });
  }

  // 1. Process Line 72 (leads_tech - exact company sequence)
  console.log('Processing Line 72 (leads_tech)...');
  const line72 = lines[72];
  if (line72) {
    let unescaped = line72
      .replace(/\\\\\"/g, '"')
      .replace(/\\\\'/g, "'")
      .replace(/\\\\r/g, '\\r')
      .replace(/\\\\n/g, '\\n')
      .replace(/\\\\t/g, '\\t')
      .replace(/\\\\\\\\/g, '\\\\');
    const firstB = unescaped.indexOf('[');
    const lastB = unescaped.lastIndexOf(']');
    if (firstB !== -1 && lastB > firstB) {
      try {
        const arr = JSON.parse(unescaped.substring(firstB, lastB + 1));
        console.log(`Line 72 parsed ${arr.length} leads in exact sequence!`);
        for (const item of arr) addLeadInOrder(item);
      } catch (e) {
        console.log('Regex parsing objects from line 72...');
        const objMatches = unescaped.substring(firstB, lastB + 1).match(/\\{[^{}]*?\\}/g);
        if (objMatches) {
          for (const o of objMatches) {
            try { addLeadInOrder(JSON.parse(o)); } catch(err) {}
          }
        }
      }
    }
  }

  // 2. Process Line 69 (leads - master holding sequence)
  console.log('Processing Line 69 (leads)...');
  const line69 = lines[69];
  if (line69) {
    let unescaped = line69
      .replace(/\\\\\"/g, '"')
      .replace(/\\\\'/g, "'")
      .replace(/\\\\r/g, '\\r')
      .replace(/\\\\n/g, '\\n')
      .replace(/\\\\t/g, '\\t')
      .replace(/\\\\\\\\/g, '\\\\');
    const firstB = unescaped.indexOf('[');
    const lastB = unescaped.lastIndexOf(']');
    if (firstB !== -1 && lastB > firstB) {
      try {
        const arr = JSON.parse(unescaped.substring(firstB, lastB + 1));
        console.log(`Line 69 parsed ${arr.length} leads!`);
        for (const item of arr) addLeadInOrder(item);
      } catch (e) {
        const objMatches = unescaped.substring(firstB, lastB + 1).match(/\\{[^{}]*?\\}/g);
        if (objMatches) {
          for (const o of objMatches) {
            try { addLeadInOrder(JSON.parse(o)); } catch(err) {}
          }
        }
      }
    }
  }

  // 3. Process Line 74 (leads_saampark - additional sequential leads)
  console.log('Processing Line 74 (leads_saampark)...');
  const line74 = lines[74];
  if (line74) {
    let unescaped = line74
      .replace(/\\\\\"/g, '"')
      .replace(/\\\\'/g, "'")
      .replace(/\\\\r/g, '\\r')
      .replace(/\\\\n/g, '\\n')
      .replace(/\\\\t/g, '\\t')
      .replace(/\\\\\\\\/g, '\\\\');
    const firstB = unescaped.indexOf('[');
    const lastB = unescaped.lastIndexOf(']');
    if (firstB !== -1 && lastB > firstB) {
      try {
        const arr = JSON.parse(unescaped.substring(firstB, lastB + 1));
        console.log(`Line 74 parsed ${arr.length} leads!`);
        for (const item of arr) addLeadInOrder(item);
      } catch (e) {
        const objMatches = unescaped.substring(firstB, lastB + 1).match(/\\{[^{}]*?\\}/g);
        if (objMatches) {
          for (const o of objMatches) {
            try { addLeadInOrder(JSON.parse(o)); } catch(err) {}
          }
        }
      }
    }
  }

  // 4. Also include any newly created leads from today's live DB if not already present
  console.log('Checking recent live leads...');
  const [liveRows] = await conn.execute('SELECT data_json FROM app_data WHERE module_key = "leads"');
  if (liveRows.length > 0) {
    try {
      const liveList = JSON.parse(liveRows[0].data_json);
      for (const item of liveList) addLeadInOrder(item);
    } catch(e) {}
  }

  console.log(`\\n>>> TOTAL LEADS RESTORED IN EXACT SEQUENCE: ${orderedLeads.length} LEADS!`);
  console.log('First lead:', orderedLeads[0]?.name, orderedLeads[0]?.phone);
  console.log('Lead 50:', orderedLeads[50]?.name, orderedLeads[50]?.phone);
  console.log('Lead 100:', orderedLeads[100]?.name, orderedLeads[100]?.phone);
  console.log('Lead 200:', orderedLeads[200]?.name, orderedLeads[200]?.phone);
  console.log('Last lead:', orderedLeads[orderedLeads.length - 1]?.name, orderedLeads[orderedLeads.length - 1]?.phone);

  // Write exact JSON payload into MySQL
  const finalJson = JSON.stringify(orderedLeads);

  for (const k of ['leads', 'leads_tech', 'leads_saampark']) {
    await conn.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [k, finalJson]
    );
    console.log(`Saved ${orderedLeads.length} leads to app_data key '${k}'`);
  }

  // Save JSON file backup
  fs.writeFileSync('/root/exact_sequence_leads.json', JSON.stringify(orderedLeads, null, 2));

  await conn.end();
  console.log('\\n✅ DATABASE RESTORATION COMPLETE!');
}

executeFullRestore().catch(e => {
  console.error('Error during execution:', e);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/perfect_sequence_restore.js', 'w') as f:
    f.write(restore_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/perfect_sequence_restore.js", timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('STDOUT:\n', out)
if err: print('STDERR:\n', err)
ssh.close()

