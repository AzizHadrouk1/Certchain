const path = require('path');

const uploadsRoot = path.join(__dirname, '../../uploads');
const institutionDir = (institutionId) =>
  path.join(uploadsRoot, 'institutions', String(institutionId));
const certificatesDir = () => path.join(uploadsRoot, 'certificates');

module.exports = { uploadsRoot, institutionDir, certificatesDir };
