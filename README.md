# ⛓ CertChain — Tamper‑Proof Diploma Verification on Hedera

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
│   │              │    │  (Institution  │    │  (PDF upload  │   │
│   │  Landing +   │    │   login +      │    │   → QR auto‑  │   │
│   │  How it      │    │   admin        │    │   detect OR   │   │
│   │  works       │    │   approval)    │    │   QR scan)    │   │
│   │  works       │    └───────┬────────┘    └──────┬────────┘   │
│   └──────────────┘            │                    │            │
└───────────────────────────────┼────────────────────┼────────────┘
                                │ HTTP (REST)         │ HTTP (REST)
                    ┌───────────▼────────────────────▼────────────┐
                    │              Node.js Backend (Express)        │
                    │                                               │
                    │   POST /api/auth/register | /login | /me      │
                    │   POST /api/admin/... (approve institutions)  │
                    │   POST /api/certificate/issue (protected)     │
                    │   GET  /api/certificate/verify/:seq           │
                    │   GET  /api/certificate/verify-qr/:token      │
                    │   POST /api/certificate/verify-hash           │
                    │   POST /api/certificate/verify-hash-qr        │
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
| **Database** | PostgreSQL (Docker) | Institution accounts + approvals + certificate index (QR → sequence) |
| **Auth** | JWT + bcrypt | Institution/admin accounts |
| **PDF + QR** | PDFKit + qrcode | Server‑generated branded certificate PDF with QR |
| **Hashing** | SHA‑256 of the generated PDF bytes | Hash anchored on Hedera HCS |

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
├── docker-compose.yml              # Postgres + Adminer (optional)
├── backend/
│   ├── db/schema.sql               # Postgres schema (init)
│   ├── src/
│   │   ├── server.js                   # Express app + startup (DB + auth + HCS)
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Register/login/me
│   │   │   ├── admin.routes.js        # Approve/reject institutions
│   │   │   ├── institution.routes.js  # Upload logo/signature assets
│   │   │   └── certificate.routes.js  # Issue + verify (seq/QR/hash) + PDF download
│   │   ├── services/
│   │   │   ├── hedera.service.js      # HCS client + Mirror Node reads
│   │   │   └── pdf.service.js         # Generate branded PDF + QR
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
| Docker Desktop (optional) | For Postgres + Adminer |

---

### Step 1 — Get Hedera Testnet Credentials

1. Go to [https://portal.hedera.com](https://portal.hedera.com) and create a free account.
2. Under **"Testnet"**, copy your **Account ID** (e.g. `0.0.1234567`) and **DER-encoded Private Key**.
3. The testnet comes pre-loaded with test HBAR — no real money needed.

---

### Step 2 — Database (recommended)

From the repo root:

```bash
docker compose up -d
```

Open **Adminer**: `http://localhost:8080`

- System: `PostgreSQL`
- Server: `postgres`
- Username: `certchain`
- Password: `certchain`
- Database: `certchain`

> If Docker cannot pull images (DNS / proxy), switch network or configure proxy/DNS.

---

### Step 3 — Configure the Backend

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

# Database + Auth
DATABASE_URL=postgresql://certchain:certchain@localhost:5432/certchain
JWT_SECRET=change-this-to-a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!

PORT=3000
FRONTEND_URL=http://localhost:4200
PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env` to git.** It is in `.gitignore` by default.

---

### Step 4 — Install & Run the Backend

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

### Step 5 — Install & Run the Frontend

```bash
cd certchain/frontend
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 📡 API Reference

### Auth

#### `POST /api/auth/register` (public)

Creates an **institution** account with status `pending` (requires admin approval).

Body: `{ email, password, institutionName, description? }`

#### `POST /api/auth/login` (public)
Body: `{ email, password }` → returns `{ token, user }`

#### `GET /api/auth/me` (Bearer)
Returns current user.

---

### Admin (approvals)

#### `GET /api/admin/institutions/pending` (admin Bearer)
List pending institutions.

#### `POST /api/admin/institutions/:id/approve` (admin Bearer)
Approve an institution.

---

### Certificates

#### `POST /api/certificate/issue` (institution Bearer + approved)

Issues a certificate by:
1) generating the **official PDF** (logo/signature optional),
2) hashing the **PDF bytes** (SHA‑256),
3) anchoring that hash on Hedera HCS,
4) storing a `qrToken` → `sequenceNumber` mapping in Postgres.

**Content‑Type**: `multipart/form-data`

Fields:
- `recipientName` (required)
- `courseName` (required)
- `issueDate` (required, ISO date)
- `courseDescription` (optional)

Response includes:
- `qrToken`
- `verifyUrl` (`/verify?qr=...`)
- `pdfUrl` (`/api/certificate/issued/:certId/pdf`)

#### `GET /api/certificate/issued/:certId/pdf` (institution Bearer)
Downloads the exact PDF that was hashed/anchored (same institution only).

---

#### `GET /api/certificate/verify/:sequenceNumber` (public)
Fetch on‑chain record by sequence number.

#### `POST /api/certificate/verify-hash` (public)
Body: `{ sequenceNumber, fileHash }`

#### `GET /api/certificate/verify-qr/:token` (public)
Resolve by QR token (token → sequenceNumber → Mirror Node).

#### `POST /api/certificate/verify-hash-qr` (public)
Body: `{ qrToken, fileHash }` (PDF hash + QR token cross‑check).

---

## 🔄 Complete User Flows

### Institution onboarding

```
1. Register institution account (/register)
2. Admin logs in (/login) → opens /admin
3. Admin approves the institution
4. Institution can issue certificates in /issue
```

### Issuing a Certificate (Approved Institution)

```
1. Navigate to /issue
2. Fill in certificate data (recipient, course, date, optional description)
3. (Optional) upload institution logo / signature (once)
4. Backend generates the official PDF and computes SHA‑256(PDF)
5. Backend anchors the hash on Hedera HCS
6. Student receives:
   - the PDF (with a QR code)
   - the HCS sequence number (optional, for manual lookup)
```

### Verifying a Certificate (Anyone)

```
1. Navigate to /verify
2. Option A — Upload the certificate PDF
   - UI auto-detects the QR code
   - Computes SHA‑256(PDF) and verifies against on-chain record
3. Option B — Scan the QR code (or paste QR token)
4. Option C — Paste the HCS sequence number
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
# Login (institution/admin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"ChangeMe123!\"}"

# Verify by sequence number
curl http://localhost:3000/api/certificate/verify/1

# Verify by QR token
curl http://localhost:3000/api/certificate/verify-qr/YOUR_QR_TOKEN
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

- [x] **QR code generation** — QR embedded in the generated certificate PDF
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
