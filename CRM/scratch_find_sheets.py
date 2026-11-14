import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

stdin, stdout, stderr = ssh.exec_command('find /var/www /root -name "*.csv" -o -name "*.xlsx" -o -name "*.xls" 2>/dev/null', timeout=60)
print('SPREADSHEETS ON VPS:\n', stdout.read().decode('utf-8', errors='replace'))
ssh.close()

