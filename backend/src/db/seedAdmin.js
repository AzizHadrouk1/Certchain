const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

/**
 * Create first admin if none exists and ADMIN_EMAIL / ADMIN_PASSWORD are set.
 */
async function ensureAdminUser() {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) return;
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );
  if (rows.length) return;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      '⚠️  No admin account. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one on startup.'
    );
    return;
  }
  const hash = await bcrypt.hash(String(password), 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`,
    [email, hash]
  );
  console.log('✅ Admin user created from ADMIN_EMAIL / ADMIN_PASSWORD');
}

module.exports = { ensureAdminUser };
