const {
  Client,
  PrivateKey,
  AccountId,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
} = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');

const TOPIC_CACHE_FILE = path.join(__dirname, '../.topic_id');

class HederaService {
  constructor() {
    this.client = null;
    this.topicId = null;
  }

  async initialize() {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    if (!accountId || !privateKey) {
      throw new Error(
        'HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env'
      );
    }

    // Build client
    if (network === 'mainnet') {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forTestnet();
    }

    this.client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    // Resolve topic ID
    await this._resolveTopicId();

    console.log('✅ Hedera client initialized');
  }

  async _resolveTopicId() {
    // 1. From env
    if (process.env.HEDERA_TOPIC_ID) {
      this.topicId = process.env.HEDERA_TOPIC_ID;
      console.log(`📋 Using topic from env: ${this.topicId}`);
      return;
    }

    // 2. From local cache file (persisted across restarts)
    if (fs.existsSync(TOPIC_CACHE_FILE)) {
      this.topicId = fs.readFileSync(TOPIC_CACHE_FILE, 'utf-8').trim();
      console.log(`📋 Using cached topic: ${this.topicId}`);
      return;
    }

    // 3. Create a new topic
    console.log('🆕 No topic found — creating new HCS topic...');
    this.topicId = await this._createTopic();
    fs.writeFileSync(TOPIC_CACHE_FILE, this.topicId);
    console.log(`✅ Created and cached new topic: ${this.topicId}`);
  }

  async _createTopic() {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo('CertChain — Diploma Verification on Hedera')
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    return receipt.topicId.toString();
  }

  /**
   * Submit a certificate record to HCS.
   * @param {Object} payload  { certId, institution, recipientName, courseName, issueDate, fileHash }
   * @returns {{ sequenceNumber: string, transactionId: string, topicId: string, timestamp: string }}
   */
  async issueCertificate(payload) {
    if (!this.client || !this.topicId) {
      throw new Error('Hedera service not initialized');
    }

    const message = JSON.stringify({
      type: 'CERTCHAIN_ISSUE',
      version: '1.0',
      ...payload,
    });

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId)
      .setMessage(message)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);

    return {
      sequenceNumber: receipt.topicSequenceNumber.toString(),
      transactionId: tx.transactionId.toString(),
      topicId: this.topicId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify a certificate by fetching its HCS message via the Mirror Node REST API.
   * @param {string} sequenceNumber
   * @returns {Object} certificate data from the message
   */
  async verifyCertificate(sequenceNumber) {
    if (!this.topicId) {
      throw new Error('Hedera service not initialized');
    }

    const network = process.env.HEDERA_NETWORK || 'testnet';
    const mirrorBase =
      network === 'mainnet'
        ? 'https://mainnet-public.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com';

    const url = `${mirrorBase}/api/v1/topics/${this.topicId}/messages/${sequenceNumber}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // not found
      }
      throw new Error(`Mirror node error: ${response.status}`);
    }

    const data = await response.json();

    // The message content is base64-encoded
    const raw = Buffer.from(data.message, 'base64').toString('utf-8');
    const payload = JSON.parse(raw);

    return {
      ...payload,
      consensusTimestamp: data.consensus_timestamp,
      sequenceNumber: data.sequence_number.toString(),
      topicId: this.topicId,
    };
  }

  getTopicId() {
    return this.topicId || 'not initialized';
  }
}

module.exports = new HederaService();
