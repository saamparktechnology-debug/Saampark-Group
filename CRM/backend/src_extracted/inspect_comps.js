const mysql = require('./node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_db',
    port: 3306
  });

  const [comps] = await conn.execute('SELECT id, name, slug FROM companies');
  console.log('Companies table:', comps);

  const [branches] = await conn.execute('SELECT id, name, company_id FROM branches');
  console.log('Branches table:', branches);

  const [appComps] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'companies'");
  if (appComps.length > 0) {
    const list = JSON.parse(appComps[0].data_json);
    console.log('app_data companies count:', list.length);
    list.forEach(c => console.log('  comp:', c.id, '|', c.name, '| slug:', c.slug));
  }

  await conn.end();
}

main().catch(console.error);
