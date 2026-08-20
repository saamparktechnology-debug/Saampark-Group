const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// 1. Start HTTP Server immediately so Node event loop remains active 24/7 in PM2
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CRM Backend Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use, retrying...`);
  } else {
    console.error('Server socket error:', err.message);
  }
});

// 2. Asynchronously verify DB Connection
async function checkDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL Database!');
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
