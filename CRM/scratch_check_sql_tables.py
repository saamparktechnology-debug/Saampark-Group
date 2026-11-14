import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

script = """
import re
import json

def check_file(filename):
    print(f"=== Checking {filename} ===")
    lead_count = 0
    app_data_leads = []
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if 'INSERT INTO `leads`' in line or 'INSERT INTO leads' in line:
                # count rows in insert: e.g. VALUES (...), (...), ...
                tuples = line.count("),(") + 1
                lead_count += tuples
                print(f"Found INSERT INTO leads with ~{tuples} records")
            if 'app_data' in line and 'leads' in line:
                print(f"Found app_data leads line of length {len(line)}")
                app_data_leads.append(line[:500])
    print(f"Total leads table rows found in {filename}: {lead_count}")

check_file('/root/crm_db_backup_before_refresh_20261103.sql')
check_file('/root/crm_backup_2026-08-24_222134.sql')
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_sql_tables.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /tmp/check_sql_tables.py", timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()

