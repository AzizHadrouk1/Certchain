const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const hederaService = require('../services/hedera.service');
const { hashBuffer, hashString } = require('../utils/hash.util');

const router = express.Router();

// Multer: store file in memory (max 20 MB)
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
 * POST /api/certificate/issue
 * Body: multipart/form-data
 *   - file (PDF, optional) OR fileHash (hex string, required if no file)
 *   - institution  (string)
 *   - recipientName (string)
 *   - courseName   (string)
 *   - issueDate    (ISO date string)
 */
router.post('/issue', upload.single('file'), async (req, res) => {
  try {
    const { institution, recipientName, courseName, issueDate } = req.body;

    if (!institution || !recipientName || !courseName || !issueDate) {
      return res.status(400).json({
        error: 'institution, recipientName, courseName and issueDate are required',
      });
    }

    // Compute or accept hash
    let fileHash;
    if (req.file) {
      fileHash = hashBuffer(req.file.buffer);
    } else if (req.body.fileHash) {
      fileHash = req.body.fileHash;
    } else {
      // Generate a deterministic hash from metadata when no file is provided
      fileHash = hashString(
        `${institution}|${recipientName}|${courseName}|${issueDate}|${uuidv4()}`
      );
    }

    const certId = uuidv4();

    const hcsResult = await hederaService.issueCertificate({
      certId,
      institution,
      recipientName,
      courseName,
      issueDate,
      fileHash,
    });

    return res.status(201).json({
      success: true,
      certId,
      fileHash,
      hcs: hcsResult,
      message: 'Certificate successfully anchored on Hedera HCS',
    });
  } catch (err) {
    console.error('Issue error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/certificate/verify/:sequenceNumber
 * Returns the on-chain certificate record for the given HCS sequence number.
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
 * Body: { sequenceNumber, fileHash }
 * Cross-checks the provided hash with the one stored on-chain.
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

module.exports = router;
