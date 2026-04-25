const crypto = require('crypto');

/**
 * Compute SHA-256 hash of a buffer and return hex string.
 * @param {Buffer} buffer
 * @returns {string}
 */
function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute SHA-256 hash of a plain string.
 * @param {string} str
 * @returns {string}
 */
function hashString(str) {
  return crypto.createHash('sha256').update(str, 'utf-8').digest('hex');
}

module.exports = { hashBuffer, hashString };
