const mysql = require('C:/Users/supri/Desktop/Ramesh Babu crm/backend/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'crm_db', port: 3306 });
  const [branchesRows] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'branches'");
  if (branchesRows.length > 0) {
    const branches = JSON.parse(branchesRows[0].data_json);
    console.log('--- Branches count:', branches.length);
    branches.forEach(b => console.log('Branch:', b.id, '| name:', b.name, '| code:', b.code, '| comp:', b.companyId, '| city:', b.city, '| phone:', b.phone, '| email:', b.email, '| gstin:', b.gstin));
  } else {
    console.log('No branches in app_data');
  }

  const [companiesRows] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'companies'");
  if (companiesRows.length > 0) {
    const comps = JSON.parse(companiesRows[0].data_json);
    console.log('--- Companies count:', comps.length);
    comps.forEach(c => console.log('Company:', c.id, '| name:', c.name, '| brand:', c.brand_name, '| gstin:', c.gstin));
  }

  await conn.end();
}

main().catch(console.error);
