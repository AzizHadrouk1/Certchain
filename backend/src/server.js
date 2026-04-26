require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { uploadsRoot } = require('./config/paths');
const { runSchemaIfNeeded } = require('./db/migrate');
const { ensureAdminUser } = require('./db/seedAdmin');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const institutionRoutes = require('./routes/institution.routes');
const certificateRoutes = require('./routes/certificate.routes');
const hederaService = require('./services/hedera.service');

fs.mkdirSync(uploadsRoot, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/certificate', certificateRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    network: process.env.HEDERA_NETWORK || 'testnet',
    topicId: hederaService.getTopicId(),
  });
});

// Global error handler (e.g. multer, async)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const msg = err.message || 'Internal server error';
  return res.status(status).json({ error: msg });
});

(async () => {
  try {
    if (process.env.DATABASE_URL) {
      await runSchemaIfNeeded();
      await ensureAdminUser();
    } else {
      console.warn('⚠️  DATABASE_URL missing — auth and DB-backed features are disabled');
    }
    await hederaService.initialize();
    app.listen(PORT, () => {
      console.log(`\n🔗 CertChain API http://localhost:${PORT}`);
      console.log(`📡 Hedera: ${process.env.HEDERA_NETWORK || 'testnet'}`);
      console.log(`📋 HCS topic: ${hederaService.getTopicId()}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
})();
