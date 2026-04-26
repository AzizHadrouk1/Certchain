const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/institutions/pending
 */
router.get('/institutions/pending', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.name, i.description, i.status, i.created_at, u.email
       FROM institutions i
       JOIN users u ON u.id = i.user_id
       WHERE i.status = 'pending'
       ORDER BY i.created_at ASC`
    );
    return res.json({ institutions: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/institutions/all
 */
router.get('/institutions', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.name, i.status, i.created_at, i.approved_at, u.email
       FROM institutions i
       JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC
       LIMIT 200`
    );
    return res.json({ institutions: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/institutions/:id/approve
 */
router.post('/institutions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE institutions
       SET status = 'approved', approved_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, name, status, approved_at`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Institution not found or not pending' });
    }
    return res.json({ institution: rows[0], message: 'Institution approved' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/institutions/:id/reject
 */
router.post('/institutions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE institutions
       SET status = 'rejected', approved_at = NULL
       WHERE id = $1 AND status = 'pending'
       RETURNING id, name, status`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Institution not found or not pending' });
    }
    return res.json({ institution: rows[0], message: 'Institution rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
