import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('187.124.132.7', username='root', password='atanU#2600004', timeout=15)

cmd = """
mysql -u root -pRootPass123 -e "CREATE DATABASE IF NOT EXISTS temp_restore;"
mysql -u root -pRootPass123 temp_restore < /root/crm_db_backup_before_refresh_20261103.sql
mysql -u root -pRootPass123 -e "SELECT module_key, LENGTH(data_json) as len FROM temp_restore.app_data WHERE module_key LIKE '%lead%';"
"""

stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
print('STDOUT:\n', stdout.read().decode('utf-8', errors='replace'))
print('STDERR:\n', stderr.read().decode('utf-8', errors='replace'))
ssh.close()
