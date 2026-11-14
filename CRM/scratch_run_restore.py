import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

# Recovery script to safely merge all lead sources
recovery_script = """
const mysql = require('/var/www/Saampark-Group/CRM/backend/node_modules/mysql2/promise');
const fs = require('fs');

async function restoreAllLeads() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RootPass123',
    database: 'crm_db'
  });

  console.log('--- Step 1: Backup current live app_data before changes ---');
  await conn.execute('CREATE TABLE IF NOT EXISTS app_data_backup_before_lead_restore AS SELECT * FROM app_data');
  console.log('Created backup table app_data_backup_before_lead_restore');

  const leadSources = [];

  // 1. Fetch from live crm_db
  const [liveRows] = await conn.execute('SELECT module_key, data_json FROM app_data WHERE module_key LIKE "%lead%"');
  for (const r of liveRows) {
    try {
      const parsed = JSON.parse(r.data_json);
      if (Array.isArray(parsed)) {
        console.log(`Live crm_db: '${r.module_key}' has ${parsed.length} leads`);
        leadSources.push({ source: 'live_' + r.module_key, leads: parsed });
      }
    } catch(e) {}
  }

  // 2. Fetch from temp_restore (from Nov 2 snapshot)
  try {
    const [tempRows] = await conn.execute('SELECT module_key, data_json FROM temp_restore.app_data WHERE module_key LIKE "%lead%"');
    for (const r of tempRows) {
      try {
        const parsed = JSON.parse(r.data_json);
        if (Array.isArray(parsed)) {
          console.log(`temp_restore (Nov 2): '${r.module_key}' has ${parsed.length} leads`);
          leadSources.push({ source: 'temp_restore_' + r.module_key, leads: parsed });
        }
      } catch(e) {}
    }
  } catch(e) {
    console.log('Error reading temp_restore:', e.message);
  }

  // 3. Fetch from temp_restore_old (August snapshot)
  try {
    const [oldRows] = await conn.execute('SELECT module_key, data_json FROM temp_restore_old.app_data WHERE module_key LIKE "%lead%"');
    for (const r of oldRows) {
      try {
        const parsed = JSON.parse(r.data_json);
        if (Array.isArray(parsed)) {
          console.log(`temp_restore_old (Aug): '${r.module_key}' has ${parsed.length} leads`);
          leadSources.push({ source: 'temp_restore_old_' + r.module_key, leads: parsed });
        }
      } catch(e) {}
    }
  } catch(e) {}

  // Merge leads intelligently:
  // Primary key: item.id (or phone if id missing)
  const mergedMap = new Map();
  const phoneToIdMap = new Map();

  // First process older sources, then newer live sources so newer updates take precedence
  const sortedSources = leadSources.reverse();

  for (const src of sortedSources) {
    for (const lead of src.leads) {
      if (!lead) continue;
      const idKey = String(lead.id || lead._id || '').toLowerCase().trim();
      const phoneClean = String(lead.phone || '').replace(/\\D/g, '');

      let matchedExistingId = null;
      if (idKey && mergedMap.has(idKey)) {
        matchedExistingId = idKey;
      } else if (phoneClean && phoneClean.length >= 7 && phoneToIdMap.has(phoneClean)) {
        matchedExistingId = phoneToIdMap.get(phoneClean);
      }

      // Ensure companyId is normalized to tech for Saampark Technology
      const normalizedLead = {
        ...lead,
        companyId: lead.companyId || 'tech',
      };

      if (matchedExistingId) {
        // Merge with existing, keeping non-empty fields
        const existing = mergedMap.get(matchedExistingId);
        mergedMap.set(matchedExistingId, {
          ...existing,
          ...normalizedLead,
          id: existing.id || normalizedLead.id,
          // Preserve any reminder notes, status, assigned caller
          reminderDate: normalizedLead.reminderDate || existing.reminderDate,
          reminderTime: normalizedLead.reminderTime || existing.reminderTime,
          reminderNotes: normalizedLead.reminderNotes || existing.reminderNotes,
          caller: normalizedLead.caller || existing.caller,
          assignedTo: normalizedLead.assignedTo || existing.assignedTo,
        });
      } else {
        const finalId = idKey || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        normalizedLead.id = finalId;
        mergedMap.set(finalId, normalizedLead);
        if (phoneClean && phoneClean.length >= 7) {
          phoneToIdMap.set(phoneClean, finalId);
        }
      }
    }
  }

  const allMergedLeads = Array.from(mergedMap.values());
  console.log(`\\n>>> TOTAL RECOVERED & MERGED UNIQUE LEADS: ${allMergedLeads.length} leads!`);

  // Write merged leads to files for safety
  fs.writeFileSync('/root/recovered_leads_all.json', JSON.stringify(allMergedLeads, null, 2));
  console.log('Saved backup copy to /root/recovered_leads_all.json');

  // Update app_data in crm_db
  const dataJson = JSON.stringify(allMergedLeads);

  // Write to 'leads', 'leads_tech', and 'leads_saampark'
  for (const targetKey of ['leads', 'leads_tech', 'leads_saampark']) {
    await conn.execute(
      `INSERT INTO app_data (module_key, data_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
      [targetKey, dataJson]
    );
    console.log(`Successfully updated '${targetKey}' with ${allMergedLeads.length} leads in MySQL.`);
  }

  // Clear deleted_items for any lead IDs in this restored set
  const restoredIds = allMergedLeads.map(l => String(l.id).toLowerCase().trim());
  if (restoredIds.length > 0) {
    try {
      await conn.execute('DELETE FROM deleted_items WHERE module_name = "leads" OR module_name = "lead"');
      console.log('Cleaned up any accidental soft-delete flags for leads');
    } catch(e) {}
  }

  console.log('\\n✅ Full Lead Restoration Complete!');
  await conn.end();
}

restoreAllLeads().catch(err => {
  console.error('Fatal error during restoration:', err);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/run_lead_restore.js', 'w') as f:
    f.write(recovery_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/run_lead_restore.js", timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

