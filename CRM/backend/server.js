const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

// Keep event loop alive permanently in PM2 to prevent exit on socket collisions
setInterval(() => {}, 60000);

let server;

function startHttpServer(portToUse) {
  try {
    server = app.listen(portToUse, '0.0.0.0', () => {
      console.log(`🚀 CRM Backend Server running on port ${portToUse}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${portToUse} in use. Retrying binding in 3 seconds...`);
        setTimeout(() => {
          try { server.close(); } catch {}
          startHttpServer(portToUse);
        }, 3000);
      } else {
        console.error('Server socket error:', err.message);
      }
    });
  } catch (err) {
    console.error('Failed to bind server socket:', err.message);
  }
}

startHttpServer(PORT);

// Asynchronously verify DB Connection
async function checkDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL Database!');
    // Ensure critical columns in users table (auto-migrate if missing on any domain/environment)
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email');
    } catch {}
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT NULL');
    } catch {}
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN sub_branch_id INT NULL');
    } catch {}
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN company_ids TEXT NULL');
    } catch {}
    connection.release();
  } catch (error) {
    console.error('⚠️ MySQL Connection warning (will retry on request):', error.message);
  }
}

checkDbConnection();

// Prevent process exit on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

