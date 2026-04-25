# ⛓ CertChain — Tamper-Proof Diploma Verification on Hedera

> **"Your degree, verifiable in seconds — no middleman."**

[![Hedera HCS](https://img.shields.io/badge/Hedera-HCS-00B8D9?style=flat-square&logo=hedera)](https://hedera.com)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat-square&logo=angular)](https://angular.io)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🎯 What is CertChain?

CertChain is a decentralised credential verification system built on the **Hedera Consensus Service (HCS)**. It allows any university or institution to issue tamper-proof digital certificates whose authenticity can be verified by anyone — employers, government agencies, or other institutions — in seconds, with zero reliance on a central database or trusted third party.

**The core insight**: a diploma's authenticity is just a hash. Hash the PDF, write that hash to a public, ordered, and immutable ledger (Hedera HCS), and you have cryptographic proof that cannot be faked.

---

## 🌍 Problem Statement

Academic credential fraud is a global crisis:

- Over **40%** of job applicants misrepresent their education ([SHRM, 2023](https://www.shrm.org))
- Diploma mills generate billions in annual revenue
- Manual verification takes **days to weeks** and costs institutions significant resources
- International degrees are especially difficult to verify across borders

As a student holding two blockchain certifications (DLTC-BF101 and HCF from the Hashgraph Association), I experienced firsthand the difficulty of proving credentials to employers who lack direct access to certification registries. CertChain solves this problem at its root.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Angular)                        │
│                                                                   │
│   ┌──────────────┐    ┌────────────────┐    ┌───────────────┐   │
│   │  Home Page   │    │  Issue Cert    │    │  Verify Cert  │   │
│   │              │    │  (SHA-256 hash │    │  (paste seq # │   │
│   │  Landing +   │    │   computed     │    │   + optional  │   │
│   │  How it      │    │   client-side) │    │   PDF upload) │   │
│   │  works       │    └───────┬────────┘    └──────┬────────┘   │
│   └──────────────┘            │                    │            │
└───────────────────────────────┼────────────────────┼────────────┘
                                │ HTTP (REST)         │ HTTP (REST)
                    ┌───────────▼────────────────────▼────────────┐
                    │              Node.js Backend (Express)        │
                    │                                               │
                    │   POST /api/certificate/issue                 │
                    │   GET  /api/certificate/verify/:seq           │
                    │   POST /api/certificate/verify-hash           │
                    │   GET  /api/health                            │
                    │                                               │
                    │   ┌─────────────────────────────────────┐    │
                    │   │         hedera.service.js            │    │
                    │   │  • TopicCreateTransaction (once)     │    │
                    │   │  • TopicMessageSubmitTransaction      │    │
                    │   │  • Mirror Node REST API query        │    │
                    │   └──────────────┬──────────────────────┘    │
                    └──────────────────┼────────────────────────────┘
                                       │ Hedera JS SDK
                    ┌──────────────────▼────────────────────────────┐
                    │              Hedera Testnet / Mainnet           │
                    │                                                 │
                    │   ┌────────────────────────────────────────┐   │
                    │   │       Hedera Consensus Service          │   │
                    │   │   Topic: CertChain Diploma Verification │   │
                    │   │                                         │   │
                    │   │  Message #1: { certId, hash, meta }    │   │
                    │   │  Message #2: { certId, hash, meta }    │   │
                    │   │  ...                                    │   │
                    │   └────────────────────────────────────────┘   │
                    │                                                 │
                    │   ┌────────────────────────────────────────┐   │
                    │   │        Hedera Mirror Node (REST)        │   │
                    │   │   Read messages by sequence number      │   │
                    │   └────────────────────────────────────────┘   │
                    └─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Angular 17 (Standalone Components) | Component architecture, reactive forms, lazy routing |
| **Backend** | Node.js + Express | Lightweight REST API, rich npm ecosystem |
| **Blockchain** | Hedera Consensus Service (HCS) | Fast finality (~3s), low cost (~$0.0001/tx), fair ordering |
| **SDK** | `@hashgraph/sdk` v2 | Official Hedera JS SDK for HCS interaction |
| **Read Layer** | Hedera Mirror Node REST API | Public, no API key needed for reads |
| **Hashing** | Web Crypto API (browser) + Node.js `crypto` | SHA-256 of PDF bytes, computed client-side |
| **File Upload** | Multer (multipart/form-data) | Handles PDF uploads in memory |

### Why Hedera HCS over other blockchains?

| | Hedera HCS | Ethereum | Bitcoin |
|---|---|---|---|
| Finality | ~3 seconds | ~12 minutes | ~60 minutes |
| Cost per message | ~$0.0001 | ~$0.50–$5 | N/A |
| Ordering | **Fair, deterministic** | Miner-dependent | N/A |
| Energy | Carbon-negative | Post-merge PoS | PoW (high) |
| Governance | Hashgraph Council | Decentralised | Decentralised |

Hedera's fair ordering guarantee is especially important for credentials: no node can reorder or censor messages.

---

## 📂 Project Structure

```
certchain/
├── backend/
│   ├── src/
│   │   ├── server.js                   # Express app + startup
│   │   ├── routes/
│   │   │   └── certificate.routes.js  # REST endpoints
│   │   ├── services/
│   │   │   └── hedera.service.js      # HCS client + Mirror Node reads
│   │   └── utils/
│   │       └── hash.util.js           # SHA-256 helpers
│   ├── .env.example                   # Template for credentials
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.ts                    # Angular bootstrap
    │   ├── index.html
    │   ├── styles.scss                # Global design tokens + typography
    │   └── app/
    │       ├── app.component.ts       # Root shell
    │       ├── app.config.ts          # provideRouter, HttpClient
    │       ├── app.routes.ts          # Lazy-loaded routes
    │       ├── models/
    │       │   └── certificate.model.ts
    │       ├── services/
    │       │   └── certificate.service.ts  # API + Web Crypto hash
    │       └── components/
    │           ├── navbar/
    │           ├── home/              # Landing page
    │           ├── issue-cert/        # Issuance form
    │           └── verify-cert/       # Verification form
    ├── angular.json
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 9+ |
| Angular CLI | 17+ (`npm install -g @angular/cli`) |
| Hedera Testnet Account | Free at [portal.hedera.com](https://portal.hedera.com) |

---

### Step 1 — Get Hedera Testnet Credentials

1. Go to [https://portal.hedera.com](https://portal.hedera.com) and create a free account.
2. Under **"Testnet"**, copy your **Account ID** (e.g. `0.0.1234567`) and **DER-encoded Private Key**.
3. The testnet comes pre-loaded with test HBAR — no real money needed.

---

### Step 2 — Configure the Backend

```bash
cd certchain/backend

# Copy the environment template
cp .env.example .env
```

Edit `.env`:

```env
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...YOUR_PRIVATE_KEY
HEDERA_TOPIC_ID=        # leave blank — created automatically on first run
PORT=3000
FRONTEND_URL=http://localhost:4200
```

> ⚠️ **Never commit `.env` to git.** It is in `.gitignore` by default.

---

### Step 3 — Install & Run the Backend

```bash
cd certchain/backend
npm install
npm run dev      # uses nodemon for hot-reload
# OR
npm start        # production start
```

On first run you will see:

```
🆕 No topic found — creating new HCS topic...
✅ Created and cached new topic: 0.0.5XXXXXX
✅ Hedera client initialized

🔗 CertChain Backend running on http://localhost:3000
📡 Hedera Network : testnet
📋 HCS Topic ID  : 0.0.5XXXXXX
```

The topic ID is cached in `backend/src/.topic_id` and reused on subsequent restarts. You can also pin it in `.env` as `HEDERA_TOPIC_ID`.

Verify the backend is healthy:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","network":"testnet","topicId":"0.0.5XXXXXX"}
```

---

### Step 4 — Install & Run the Frontend

```bash
cd certchain/frontend
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 📡 API Reference

### `POST /api/certificate/issue`

Issue a certificate by anchoring its hash on HCS.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `institution` | string | ✅ | Issuing institution name |
| `recipientName` | string | ✅ | Full name of the graduate |
| `courseName` | string | ✅ | Degree or course title |
| `issueDate` | string | ✅ | ISO date (e.g. `2024-06-15`) |
| `file` | PDF file | Optional | Diploma PDF (hashed server-side) |
| `fileHash` | string | Optional | Pre-computed SHA-256 hex |

**Response `201`:**
```json
{
  "success": true,
  "certId": "550e8400-e29b-41d4-a716-446655440000",
  "fileHash": "a3f1c9d2...",
  "hcs": {
    "sequenceNumber": "42",
    "transactionId": "0.0.1234567@1718449200.000000000",
    "topicId": "0.0.5000001",
    "timestamp": "2024-06-15T10:00:00.000Z"
  },
  "message": "Certificate successfully anchored on Hedera HCS"
}
```

---

### `GET /api/certificate/verify/:sequenceNumber`

Fetch and return the on-chain certificate record.

**Response `200`:**
```json
{
  "verified": true,
  "certificate": {
    "type": "CERTCHAIN_ISSUE",
    "version": "1.0",
    "certId": "550e8400-...",
    "institution": "University of Algiers",
    "recipientName": "Ahmed Ben Ali",
    "courseName": "Master of Computer Science",
    "issueDate": "2024-06-15",
    "fileHash": "a3f1c9d2...",
    "consensusTimestamp": "1718449203.123456789",
    "sequenceNumber": "42",
    "topicId": "0.0.5000001"
  }
}
```

---

### `POST /api/certificate/verify-hash`

Cross-check a provided file hash with the on-chain record.

**Body:**
```json
{
  "sequenceNumber": "42",
  "fileHash": "a3f1c9d2..."
}
```

**Response `200`:**
```json
{
  "verified": true,
  "hashMatch": true,
  "certificate": { ... },
  "message": "✅ Hash matches — certificate is authentic"
}
```

---

## 🔄 Complete User Flows

### Issuing a Certificate (Institution)

```
1. Navigate to /issue
2. Fill in: institution, recipient, course, date
3. (Optional) Upload the diploma PDF
   → SHA-256 is computed in the browser via Web Crypto API
   → The file never leaves the browser
4. Click "Anchor on Hedera"
5. Backend submits a JSON message to HCS
6. Hedera returns a consensus timestamp + sequence number
7. Institution gives the graduate their sequence number (e.g. "#42")
```

### Verifying a Certificate (Employer)

```
1. Navigate to /verify
2. Enter the sequence number (#42)
3. (Optional) Upload the diploma PDF the graduate provided
4. Click "Verify Certificate"
5. Backend queries the Hedera Mirror Node REST API (public, no auth needed)
6. If PDF was uploaded: SHA-256 is compared with the on-chain hash
7. Result shown: ✅ authentic / ❌ tampered / ❌ not found
```

---

## 🔐 Security Model

| Attack | CertChain's defence |
|---|---|
| **Forged certificate** | Cannot match HCS message without institution's Hedera account |
| **Tampered PDF** | SHA-256 mismatch detected during hash verification |
| **Fake sequence number** | Mirror Node returns 404; UI shows "not found" |
| **Man-in-the-middle** | HCS messages are cryptographically signed by the submitter |
| **Central DB breach** | No central DB — all truth lives on the public ledger |

**Privacy note**: Only the SHA-256 hash, not the PDF itself, is written on-chain. The institution retains custody of the original document.

---

## 🧪 Testing the API with curl

```bash
# Issue a certificate (no file, metadata-only)
curl -X POST http://localhost:3000/api/certificate/issue \
  -F "institution=Test University" \
  -F "recipientName=Jane Doe" \
  -F "courseName=BSc Computer Science" \
  -F "issueDate=2024-06-01"

# Verify by sequence number (replace 1 with the returned sequenceNumber)
curl http://localhost:3000/api/certificate/verify/1

# Verify with hash cross-check
curl -X POST http://localhost:3000/api/certificate/verify-hash \
  -H "Content-Type: application/json" \
  -d '{"sequenceNumber":"1","fileHash":"YOUR_HASH_HERE"}'
```

---

## 🌐 Viewing on Hedera Explorer

Every certificate transaction can be independently verified at:

- **Testnet**: [https://hashscan.io/testnet/topic/YOUR_TOPIC_ID](https://hashscan.io/testnet/topic/)
- **Mainnet**: [https://hashscan.io/mainnet/topic/YOUR_TOPIC_ID](https://hashscan.io/mainnet/topic/)

This demonstrates that no backend is required for verification — the truth is on the public ledger.

---

## 🚢 Deployment

### Backend (e.g. Railway, Render, Fly.io)

```bash
cd backend
# Set all environment variables in your platform's dashboard
# Then:
npm start
```

### Frontend (e.g. Netlify, Vercel)

```bash
cd frontend
# Update src/environments/environment.prod.ts with your backend URL
ng build --configuration production
# Deploy the dist/certchain-frontend/ folder
```

---

## 🗺️ Roadmap

- [ ] **QR code generation** — embed the sequence number in a scannable QR on the diploma PDF
- [ ] **Bulk issuance** — CSV upload for graduation ceremonies (dozens of certs in one batch)
- [ ] **Revocation** — submit a CERTCHAIN_REVOKE message to invalidate a credential
- [ ] **Institution registry** — map institution names to their Hedera account IDs on-chain
- [ ] **DID integration** — link certificates to W3C Decentralised Identifiers
- [ ] **Legal layer** — governance framework and eIDAS2 / EBSI compatibility study (DDiB focus)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
git clone https://github.com/YOUR_USERNAME/certchain.git
cd certchain
# Set up backend and frontend as described above
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

Built for the **DDiB 2026 — Deep Dive into Blockchain** international summer school selection hackathon.

Inspired by personal certifications in distributed ledger technology and a conviction that academic credentials should be as trustless as the blockchain protocols they describe.

---

*"Academic fraud costs institutions millions and harms honest graduates. CertChain uses Hedera's fast, low-cost consensus to make credential verification instant and global."*
