const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generates a signed JWT token
 * @param {Object} payload - User information (e.g., { id, role_id, email })
 * @param {string} expiresIn - Optional expiration override (defaults to env config)
 * @returns {string} Signed JWT token string
 */
const generateToken = (payload, expiresIn = env.jwt.expiresIn) => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn,
  });
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

module.exports = {
  generateToken,
  verifyToken,
};