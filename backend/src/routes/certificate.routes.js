const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const hederaService = require('../services/hedera.service');
const { buildCertificatePdf } = require('../services/pdf.service');
const { hashBuffer } = require('../utils/hash.util');
const { pool } = require('../db/pool');
const {
  requireAuth,
  loadInstitutionUser,
  requireApprovedInstitution,
  requireInstitutionCanAccessCert,
} = require('../middleware/auth.middleware');
const { institutionDir, certificatesDir } = require('../config/paths');
const fs = require('fs');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

/**
 * GET /api/certificate/verify-qr/:token
 * Public: resolve on-chain cert by our QR token.
 */
router.get('/verify-qr/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length > 64) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const { rows } = await pool.query(
      `SELECT hcs_sequence_number FROM issued_certificates WHERE qr_token = $1`,
      [token]
    );
    if (!rows.length) {
      return res.json({
        verified: false,
        message: 'No certificate found for this QR reference',
      });
    }
    const sequenceNumber = rows[0].hcs_sequence_number;
    const record = await hederaService.verifyCertificate(sequenceNumber);
    if (!record) {
      return res.json({
        verified: false,
        message: 'On-chain message not found',
      });
    }
    return res.json({ verified: true, certificate: record });
  } catch (err) {
    console.error('verify-qr error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/certificate/issued/:certId/pdf
 * Stream branded PDF (institution that issued the certificate only).
 */
router.get(
  '/issued/:certId/pdf',
  requireAuth,
  loadInstitutionUser,
  requireInstitutionCanAccessCert,
  async (req, res) => {
    try {
      const c = req.issuedCert;
      const inst = req.institution;
      const certDir = certificatesDir();
      fs.mkdirSync(certDir, { recursive: true });
      const pdfPath = path.join(certDir, `${c.cert_id}.pdf`);

      if (fs.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="certchain-${c.cert_id}.pdf"`
        );
        return res.send(fs.readFileSync(pdfPath));
      }

      const record = await hederaService.verifyCertificate(c.hcs_sequence_number);
      const front = process.env.FRONTEND_URL || 'http://localhost:4200';
      const verifyUrl = `${front.replace(/\/$/, '')}/verify?qr=${c.qr_token}`;

      const dir = institutionDir(inst.id);
      const logoPath = inst.logo_filename
        ? path.join(dir, inst.logo_filename)
        : null;
      const signaturePath = inst.signature_filename
        ? path.join(dir, inst.signature_filename)
        : null;

      const buf = await buildCertificatePdf({
        institutionName: c.institution_name_snapshot,
        logoPath: logoPath && fs.existsSync(logoPath) ? logoPath : null,
        signaturePath: signaturePath && fs.existsSync(signaturePath) ? signaturePath : null,
        recipientName: c.recipient_name,
        courseName: c.course_name,
        courseDescription: c.course_description || (record && (record.courseDescription || record.coursedescription)) || null,
        issueDate: String(c.issue_date).slice(0, 10),
        fileHash: c.file_hash,
        sequenceNumber: c.hcs_sequence_number,
        topicId: c.topic_id,
        certId: c.cert_id,
        verifyUrl,
        network: process.env.HEDERA_NETWORK || 'testnet',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="certchain-${c.cert_id}.pdf"`
      );
      return res.send(buf);
    } catch (err) {
      console.error('pdf error:', err);
      return res.status(500).json({ error: err.message || 'PDF generation failed' });
    }
  }
);

/**
 * POST /api/certificate/issue (approved institutions only)
 */
router.post(
  '/issue',
  requireAuth,
  loadInstitutionUser,
  requireApprovedInstitution,
  upload.single('file'),
  async (req, res) => {
    try {
      const { recipientName, courseName, issueDate, courseDescription } = req.body;
      const inst = req.institution;
      const institution = inst.name;

      if (!recipientName || !courseName || !issueDate) {
        return res.status(400).json({
          error: 'recipientName, courseName and issueDate are required',
        });
      }

      const certId = uuidv4();
      const qrToken = crypto.randomBytes(20).toString('hex');
      const front = process.env.FRONTEND_URL || 'http://localhost:4200';
      const verifyUrl = `${front.replace(/\/$/, '')}/verify?qr=${qrToken}`;

      // Optional branding images
      const dir = institutionDir(inst.id);
      const logoPath = inst.logo_filename ? path.join(dir, inst.logo_filename) : null;
      const signaturePath = inst.signature_filename
        ? path.join(dir, inst.signature_filename)
        : null;

      // Build a canonical certificate PDF (no hash printed inside, so the PDF hash is stable).
      // Note: we keep file upload for future, but current flow hashes the generated PDF.
      const pdfBuf = await buildCertificatePdf({
        institutionName: institution,
        logoPath: logoPath && fs.existsSync(logoPath) ? logoPath : null,
        signaturePath: signaturePath && fs.existsSync(signaturePath) ? signaturePath : null,
        recipientName,
        courseName,
        courseDescription: courseDescription || null,
        issueDate,
        fileHash: null,
        sequenceNumber: 'pending',
        topicId: hederaService.getTopicId(),
        certId,
        verifyUrl,
        network: process.env.HEDERA_NETWORK || 'testnet',
      });

      const fileHash = hashBuffer(pdfBuf);

      const hcsResult = await hederaService.issueCertificate({
        certId,
        institution,
        recipientName,
        courseName,
        issueDate,
        fileHash,
        courseDescription: courseDescription || undefined,
        qrToken,
      });

      // Persist the PDF bytes used for hashing (so later downloads match the anchored hash)
      const certDir = certificatesDir();
      fs.mkdirSync(certDir, { recursive: true });
      fs.writeFileSync(path.join(certDir, `${certId}.pdf`), pdfBuf);

      await pool.query(
        `INSERT INTO issued_certificates (
          institution_id, cert_id, qr_token, hcs_sequence_number, topic_id, file_hash,
          institution_name_snapshot, recipient_name, course_name, course_description, issue_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date)`,
        [
          inst.id,
          certId,
          qrToken,
          hcsResult.sequenceNumber,
          hcsResult.topicId,
          fileHash,
          institution,
          recipientName,
          courseName,
          courseDescription || null,
          issueDate,
        ]
      );

      const apiBase = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;

      return res.status(201).json({
        success: true,
        certId,
        fileHash,
        qrToken,
        verifyUrl,
        pdfUrl: `${apiBase}/api/certificate/issued/${certId}/pdf`,
        hcs: hcsResult,
        message: 'Certificate successfully anchored on Hedera HCS',
      });
    } catch (err) {
      console.error('Issue error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/certificate/verify/:sequenceNumber
 */
router.get('/verify/:sequenceNumber', async (req, res) => {
  try {
    const { sequenceNumber } = req.params;

    if (!sequenceNumber || isNaN(Number(sequenceNumber))) {
      return res.status(400).json({ error: 'Invalid sequence number' });
    }

    const record = await hederaService.verifyCertificate(sequenceNumber);

    if (!record) {
      return res.status(404).json({
        verified: false,
        message: 'No certificate found for this sequence number',
      });
    }

    return res.json({
      verified: true,
      certificate: record,
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/certificate/verify-hash
 */
router.post('/verify-hash', async (req, res) => {
  try {
    const { sequenceNumber, fileHash } = req.body;

    if (!sequenceNumber || !fileHash) {
      return res.status(400).json({ error: 'sequenceNumber and fileHash are required' });
    }

    const record = await hederaService.verifyCertificate(sequenceNumber);

    if (!record) {
      return res.status(404).json({
        verified: false,
        hashMatch: false,
        message: 'No certificate found on-chain for this sequence number',
      });
    }

    const hashMatch = record.fileHash === fileHash;

    return res.json({
      verified: true,
      hashMatch,
      certificate: record,
      message: hashMatch
        ? '✅ Hash matches — certificate is authentic'
        : '❌ Hash mismatch — certificate may have been tampered with',
    });
  } catch (err) {
    console.error('Verify-hash error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/certificate/verify-hash-qr
 * Optional: verify by QR token + file hash
 */
router.post('/verify-hash-qr', async (req, res) => {
  try {
    const { qrToken, fileHash } = req.body;
    if (!qrToken || !fileHash) {
      return res.status(400).json({ error: 'qrToken and fileHash are required' });
    }
    const { rows } = await pool.query(
      `SELECT hcs_sequence_number, file_hash FROM issued_certificates WHERE qr_token = $1`,
      [qrToken]
    );
    if (!rows.length) {
      return res.status(404).json({
        verified: false,
        hashMatch: false,
        message: 'Unknown QR token',
      });
    }
    const seq = rows[0].hcs_sequence_number;
    const expectedHash = rows[0].file_hash;
    const record = await hederaService.verifyCertificate(seq);
    if (!record) {
      return res.status(404).json({
        verified: false,
        hashMatch: false,
        message: 'On-chain record not found',
      });
    }
    const hashMatch = expectedHash === fileHash && record.fileHash === fileHash;
    return res.json({
      verified: true,
      hashMatch,
      certificate: record,
      message: hashMatch
        ? '✅ Hash matches — certificate is authentic'
        : '❌ Hash mismatch — document may not match this QR code',
    });
  } catch (err) {
    console.error('verify-hash-qr', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
