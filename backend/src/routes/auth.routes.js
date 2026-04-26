const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { requireAuth, signUserToken } = require('../middleware/auth.middleware');

const router = express.Router();

function toPublicUser(userRow, instRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    role: userRow.role,
    institution: instRow
      ? {
          id: instRow.id,
          name: instRow.name,
          status: instRow.status,
          description: instRow.description,
        }
      : null,
  };
}

/**
 * POST /api/auth/register
 * Body: { email, password, institutionName, description? }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, institutionName, description } = req.body;
    if (!email || !password || !institutionName) {
      return res
        .status(400)
        .json({ error: 'email, password and institutionName are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const em = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(String(password), 10);
    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [em]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      await client.query('BEGIN');
      const u = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'institution')
         RETURNING id, email, role, created_at`,
        [em, hash]
      );
      const inst = await client.query(
        `INSERT INTO institutions (user_id, name, description, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING id, name, status, description`,
        [u.rows[0].id, String(institutionName).trim(), description || null]
      );
      await client.query('COMMIT');
      return res.status(201).json({
        message: 'Account created. Your institution is pending admin approval.',
        user: toPublicUser(u.rows[0], inst.rows[0]),
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const em = String(email).trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role,
              i.id AS inst_id, i.name AS inst_name, i.status AS inst_status, i.description AS inst_desc
       FROM users u
       LEFT JOIN institutions i ON i.user_id = u.id
       WHERE u.email = $1`,
      [em]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const row = rows[0];
    const ok = await bcrypt.compare(String(password), row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const instRow = row.inst_id
      ? {
          id: row.inst_id,
          name: row.inst_name,
          status: row.inst_status,
          description: row.inst_desc,
        }
      : null;
    const userRow = { id: row.id, email: row.email, role: row.role };
    const token = signUserToken(userRow, instRow);
    return res.json({
      token,
      user: toPublicUser(userRow, instRow),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = users[0];
    if (u.role === 'admin') {
      return res.json({ user: toPublicUser(u, null) });
    }
    const { rows: insts } = await pool.query(
      `SELECT id, name, status, description, website, address, created_at, approved_at,
              logo_filename, signature_filename
       FROM institutions WHERE user_id = $1`,
      [u.id]
    );
    return res.json({
      user: toPublicUser(
        u,
        insts[0] || null
      ),
    });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
