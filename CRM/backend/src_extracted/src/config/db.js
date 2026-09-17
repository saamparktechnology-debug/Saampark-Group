const mysql = require('mysql2/promise');
const env = require('./env');

// Master Default Pool (SAAMPARK TECHNOLOGY / crm_db)
const defaultPool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Dedicated Company Database Pools Cache
const companyPools = new Map();

function getCompanyDbName(companyId) {
  if (!companyId) return env.db.database;
  const str = String(companyId).toLowerCase().trim();
  if (str === 'consultancy' || str.includes('consult')) {
    return process.env.DB_NAME_CONSULTANCY || 'saampark_consultancy';
  }
  if (str === 'tech' || str.includes('tech')) {
    return process.env.DB_NAME_TECH || 'saampark_technology';
  }
  return env.db.database;
}

function getCompanyPool(companyId) {
  const dbName = getCompanyDbName(companyId);
  if (dbName === env.db.database) {
    return defaultPool;
  }

  if (!companyPools.has(dbName)) {
    const newPool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: env.db.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    companyPools.set(dbName, newPool);
  }

  return companyPools.get(dbName);
}

module.exports = defaultPool;
module.exports.getCompanyPool = getCompanyPool;
module.exports.getCompanyDbName = getCompanyDbName;