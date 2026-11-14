const bcrypt = require('bcryptjs');

/**
 * Hashes a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed or plain password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed or plain password stored in DB
 * @returns {Promise<boolean>} Match result
 */
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  const pStr = String(password);
  const hStr = String(hashedPassword);
  if (pStr === hStr || pStr.trim() === hStr || pStr === hStr.trim()) return true;
  try {
    return await bcrypt.compare(pStr, hStr) || await bcrypt.compare(pStr.trim(), hStr);
  } catch (err) {
    return false;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};