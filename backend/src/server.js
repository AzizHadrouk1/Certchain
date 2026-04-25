require('dotenv').config();
const express = require('express');
const cors = require('cors');
const certificateRoutes = require('./routes/certificate.routes');
const hederaService = require('./services/hedera.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/certificate', certificateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    network: process.env.HEDERA_NETWORK || 'testnet',
    topicId: hederaService.getTopicId(),
  });
});

// Start server and initialize Hedera
(async () => {
  try {
    await hederaService.initialize();
    app.listen(PORT, () => {
      console.log(`\n🔗 CertChain Backend running on http://localhost:${PORT}`);
      console.log(`📡 Hedera Network : ${process.env.HEDERA_NETWORK || 'testnet'}`);
      console.log(`📋 HCS Topic ID  : ${hederaService.getTopicId()}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize Hedera service:', err.message);
    process.exit(1);
  }
})();
