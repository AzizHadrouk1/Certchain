const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * @param {object} p
 */
function buildCertificatePdf(p) {
  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const textW = doc.page.width - 96;
      let y = 48;

      if (p.logoPath && fs.existsSync(p.logoPath)) {
        try {
          doc.image(p.logoPath, 48, y, { width: 64, height: 64, fit: [64, 64] });
        } catch (_) {
          /* ignore */
        }
      }
      y = 48;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6b7280')
        .text('CertChain — Hedera HCS', 48, y, { width: textW, align: 'right' });

      y = 120;
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#0d1117')
        .text('Certificate of completion', 48, y, { width: textW, align: 'center' });

      y += 40;
      doc.font('Helvetica').fontSize(11).fillColor('#0d1117');
      doc.text('This is to certify that', 48, y, { width: textW, align: 'center' });
      y += 24;
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .text(p.recipientName, 48, y, { width: textW, align: 'center' });
      y += 32;
      doc.font('Helvetica').fontSize(11).text('has completed', 48, y, {
        width: textW,
        align: 'center',
      });
      y += 24;
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(p.courseName, 48, y, { width: textW, align: 'center' });
      y += 32;

      if (p.courseDescription) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#4b5563')
          .text(p.courseDescription, 48, y, { width: textW, align: 'left' });
        y += 40;
      }

      doc.fillColor('#0d1117');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Issued by: ${p.institutionName}`, 48, y, { width: textW, align: 'left' });
      y += 16;
      doc.text(`Date: ${p.issueDate}`, 48, y);
      y += 16;
      doc.text(
        `HCS sequence: ${p.sequenceNumber}  •  Topic: ${p.topicId}  •  Network: ${p.network}`,
        48,
        y,
        { width: textW, align: 'left' }
      );
      y += 18;
      doc
        .fontSize(7)
        .fillColor('#6b7280')
        .text(`Certificate ID: ${p.certId}`, 48, y, { width: textW, align: 'left' });
      y += 12;
      if (p.fileHash) {
        doc.text(`SHA-256: ${p.fileHash}`, 48, y, { width: textW, align: 'left' });
      }

      const qrPng = await QRCode.toBuffer(p.verifyUrl, { type: 'png', width: 140, margin: 1 });
      const bottom = doc.page.height - 200;
      doc.image(qrPng, doc.page.width - 48 - 130, bottom, { width: 120, height: 120 });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#4b5563')
        .text('Verify (scan or open):', 48, bottom);
      doc
        .fontSize(6)
        .fillColor('#6b7280')
        .text(p.verifyUrl, 48, bottom + 12, { width: doc.page.width - 220, align: 'left' });

      if (p.signaturePath && fs.existsSync(p.signaturePath)) {
        try {
          doc.image(p.signaturePath, 48, bottom + 60, { width: 100, height: 40 });
        } catch (_) {}
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor('#0d1117')
          .text('Institution signature (optional)', 48, bottom + 108);
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { buildCertificatePdf };
