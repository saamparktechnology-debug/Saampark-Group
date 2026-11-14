import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

node_script = """
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/root/all_recovered_350_leads.json', 'utf-8'));

console.log('Total raw items in /root/all_recovered_350_leads.json:', data.length);

// Filter to genuine leads that have at least name or phone or contact
const validLeads = data.filter(l => {
  if (!l) return false;
  // A lead has a name or primaryContact or phone or business name
  const name = (l.name || l.businessName || l.client || '').trim();
  const phone = (l.phone || l.mobile || '').trim();
  const contact = (l.primaryContact || l.contact || '').trim();
  return Boolean(name || phone || contact);
});

console.log('Valid leads with name/phone/contact:', validLeads.length);

// Sample 5 leads
for (let i = 0; i < Math.min(10, validLeads.length); i++) {
  const l = validLeads[i];
  console.log(`Lead ${i}: id=${l.id}, name="${l.name}", phone="${l.phone}", contact="${l.primaryContact}", status="${l.status}"`);
}

// Check how many have phone
const withPhone = validLeads.filter(l => l.phone && l.phone.length > 5);
console.log('Leads with valid phone numbers:', withPhone.length);
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/verify_recovered_leads.js', 'w') as f:
    f.write(node_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("node /tmp/verify_recovered_leads.js", timeout=60)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

