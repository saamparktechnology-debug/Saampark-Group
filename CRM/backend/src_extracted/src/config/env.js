const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') ? process.env.DB_PASSWORD : 'RootPass123',

    database: process.env.DB_NAME || 'crm_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },

  jwt: {
    secret: process.env.JWT_SECRET || '8vK#2mQ!7xP@4zL$9rT^6nW&3cY*5sH@1jF!8dQ#0kV$6pX',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};

module.exports = env;