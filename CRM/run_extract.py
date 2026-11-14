import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

remote_code = """
import re
import json

print("Scanning /root/crm_db_backup_before_refresh_20261103.sql...")
with open('/root/crm_db_backup_before_refresh_20261103.sql', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if 'app_data' in line and 'INSERT INTO' in line:
            # Look for ('leads' or ('leads_tech' etc
            for key in ['leads', 'leads_tech', 'leads_saampark', 'leads_consultancy']:
                pattern = "('" + key + "',"
                if pattern in line:
                    print(f"Found key {key} in backup, extracting JSON...")
                    # Extract string literal
                    idx = line.find(pattern)
                    # Next characters are the json string
                    sub = line[idx + len(pattern):]
                    if sub.startswith("'") or sub.startswith(" '"):
                        start_q = sub.find("'")
                        # Find end quote
                        # Since it is a MySQL dump, quotes inside are escaped by \\' or ''
                        # Let's search until next quote not preceded by backslash
                        i = start_q + 1
                        escaped = False
                        chars = []
                        while i < len(sub):
                            ch = sub[i]
                            if ch == '\\\\' and not escaped:
                                escaped = True
                                i += 1
                                continue
                            if ch == "'" and not escaped:
                                break
                            if escaped:
                                if ch == 'n': chars.append('\\n')
                                elif ch == 'r': chars.append('\\r')
                                elif ch == 't': chars.append('\\t')
                                elif ch == "'": chars.append("'")
                                elif ch == '"': chars.append('"')
                                elif ch == '\\\\': chars.append('\\\\')
                                else:
                                    chars.append('\\\\')
                                    chars.append(ch)
                                escaped = False
                            else:
                                chars.append(ch)
                            i += 1
                        json_str = "".join(chars)
                        try:
                            data = json.loads(json_str)
                            print(f"SUCCESS: Key {key} in backup has {len(data)} items!")
                            # Save to file
                            with open(f"/tmp/backup_{key}.json", "w", encoding="utf-8") as out:
                                json.dump(data, out)
                            print(f"Saved to /tmp/backup_{key}.json")
                        except Exception as e:
                            print(f"JSON parse error for {key}:", str(e)[:100])
                            print(f"Sample raw string: {json_str[:200]}")

print("Done scanning.")
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/extract_backup_leads.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /tmp/extract_backup_leads.py", timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

