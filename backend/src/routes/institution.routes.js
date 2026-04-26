const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { pool } = require('../db/pool');
const {
  requireAuth,
  loadInstitutionUser,
} = require('../middleware/auth.middleware');
const { institutionDir } = require('../config/paths');

const router = express.Router();
router.use(requireAuth, loadInstitutionUser);
router.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG or WebP images are allowed'));
    }
  },
});

/**
 * PATCH /api/institution/profile
 * Body: { description?, website?, address? }
 */
router.patch('/profile', async (req, res) => {
  try {
    const { description, website, address } = req.body;
    const inst = req.institution;
    const d = description !== undefined ? description : inst.description;
    const w = website !== undefined ? String(website).trim() || null : inst.website;
    const a = address !== undefined ? String(address).trim() || null : inst.address;
    const { rows } = await pool.query(
      `UPDATE institutions
       SET description = $1, website = $2, address = $3
       WHERE id = $4
       RETURNING id, name, description, website, address, status`,
      [d, w, a, inst.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ institution: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/institution/assets/logo
 */
router.post('/assets/logo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const dir = institutionDir(req.institution.id);
    fs.mkdirSync(dir, { recursive: true });
    const ext =
      req.file.mimetype === 'image/png'
        ? '.png'
        : req.file.mimetype === 'image/webp'
          ? '.webp'
          : '.jpg';
    const filename = `logo${ext}`;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);
    await pool.query('UPDATE institutions SET logo_filename = $1 WHERE id = $2', [
      filename,
      req.institution.id,
    ]);
    return res.json({ ok: true, filename });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * POST /api/institution/assets/signature
 */
router.post('/assets/signature', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const dir = institutionDir(req.institution.id);
    fs.mkdirSync(dir, { recursive: true });
    const ext =
      req.file.mimetype === 'image/png'
        ? '.png'
        : req.file.mimetype === 'image/webp'
          ? '.webp'
          : '.jpg';
    const filename = `signature${ext}`;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);
    await pool.query('UPDATE institutions SET signature_filename = $1 WHERE id = $2', [
      filename,
      req.institution.id,
    ]);
    return res.json({ ok: true, filename });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
