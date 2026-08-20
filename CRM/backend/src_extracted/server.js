const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Test MySQL Database Connection on startup
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL Database!');
    connection.release();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CRM Backend Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} in use, retrying in 2 seconds...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT, '0.0.0.0');
        }, 2000);
      } else {
        console.error('Server socket error:', err.message);
      }
    });
  } catch (error) {
    console.error('❌ Unable to connect to MySQL Database:', error.message);
  }
}

// Prevent process exit on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

startServer();