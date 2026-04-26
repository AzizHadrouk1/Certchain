const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = h.slice(7);
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server auth not configured' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

async function loadInstitutionUser(req, res, next) {
  try {
    if (req.user?.role !== 'institution') {
      return res.status(403).json({ error: 'Institution access only' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM institutions WHERE user_id = $1`,
      [req.user.sub]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'No institution profile' });
    }
    req.institution = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

function requireApprovedInstitution(_req, res, next) {
  if (_req.institution.status !== 'approved') {
    return res.status(403).json({
      error: 'Your institution is not approved to issue certificates yet',
      status: _req.institution.status,
    });
  }
  next();
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function requireInstitutionCanAccessCert(req, res, next) {
  try {
    const certId = req.params.certId;
    if (!certId) {
      return res.status(400).json({ error: 'Missing certificate id' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM issued_certificates WHERE cert_id = $1 AND institution_id = $2`,
      [certId, req.institution.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    req.issuedCert = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

function signUserToken(userRow, instRow) {
  const token = jwt.sign(
    {
      sub: userRow.id,
      email: userRow.email,
      role: userRow.role,
      iid: instRow ? instRow.id : null,
      ist: instRow ? instRow.status : null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
}

module.exports = {
  requireAuth,
  requireAdmin,
  loadInstitutionUser,
  requireApprovedInstitution,
  requireInstitutionCanAccessCert,
  signUserToken,
};
