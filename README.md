# Aegis Cyber — AI-Powered Secure Decentralized File Sharing & Cyber Defense Platform

<div align="center">

![Aegis Cyber](https://img.shields.io/badge/Aegis-Cyber_Defense-00ff88?style=for-the-badge&logo=shield&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8-363636?style=flat-square&logo=ethereum)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**Enterprise-ready, production-grade cybersecurity and decentralized file vault system**  
enforcing Zero Trust Architecture with AI Threat Analysis, Hybrid Encryption, IPFS storage, and EVM Smart Contracts.

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Prerequisites](#6-prerequisites)
7. [Installation & Setup](#7-installation--setup)
8. [Environment Configuration](#8-environment-configuration)
9. [Running the Application](#9-running-the-application)
10. [Database Setup](#10-database-setup)
11. [API Reference](#11-api-reference)
12. [Authentication & Security](#12-authentication--security)
13. [Blockchain & Smart Contracts](#13-blockchain--smart-contracts)
14. [Testing](#14-testing)
15. [Deployment (Docker)](#15-deployment-docker)
16. [Demo Credentials](#16-demo-credentials)
17. [Current Limitations & Roadmap](#17-current-limitations--roadmap)
18. [Contributors](#18-contributors)
19. [License](#19-license)

---

## 1. Project Overview

**Aegis Cyber** is an academic-to-production grade cybersecurity platform that combines:

- **Zero Trust Security** — every request is continuously verified using behavioral biometrics, IP whitelisting, RBAC/ABAC role guards, and AI-powered UEBA scoring.
- **Decentralized File Storage** — files are encrypted in-memory with AES-256-GCM, indexed on an EVM smart contract, and stored on IPFS (with Pinata Cloud or local mock fallback).
- **AI Threat Analysis** — a dedicated FastAPI microservice provides heuristic malware scanning, Shannon entropy analysis (ransomware detection), PII scanning (SSN, Aadhaar, PAN, credit card), steganography detection, and UEBA behavioral analytics.
- **SOC Dashboard** — a cyberpunk-themed React frontend provides real-time WebSocket threat feeds, interactive analytics, compliance scorecards (GDPR / ISO 27001 / NIST CSF), and an AI Security Copilot.

### Problem Statement

Traditional file sharing systems are centralized, trust-based, and lack real-time threat intelligence. This platform solves:
- Insider threats via continuous behavioral monitoring
- Data exfiltration via content scanning before storage
- Auditability via immutable blockchain records
- Credential theft via Zero Trust session controls

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Security Engine** | Heuristic malware/trojan detection, Shannon entropy ransomware checks, PII regex scanning, steganography detection, MITRE ATT&CK mapping |
| 🛡️ **Zero Trust Gateway** | Behavioral biometric scoring (keystroke + mouse dynamics), impossible travel detection, IP whitelisting, concurrent session limits |
| 🔐 **Hybrid Encryption** | AES-256-GCM file encryption, RSA-4096 key wrapping, ECDSA digital signatures on EVM, PQC readiness (Kyber-1024 simulation) |
| ⛓️ **Blockchain Integrity** | Hardhat local EVM, `FileRegistry.sol` (file hash, CID, access control), `DecentralizedID.sol` (DID registry) |
| 📁 **Decentralized Storage** | Pinata IPFS pinning with automatic local file-system mock fallback |
| 📊 **SOC Dashboard** | Real-time WebSocket event streams, Recharts analytics, GDPR/ISO 27001/NIST CSF compliance meters |
| 🤝 **Secure File Sharing** | Time-locked share links with QR codes, max-download limits, ECDSA-verified access |
| 🧠 **AI Copilot** | Natural language forensics, compliance Q&A, and incident mitigation recommendations |
| 🔍 **Forensics & Audit** | Full audit trail, session timeline, geographic anomaly detection |
| 🌐 **Local LLM** | On-device WebWorker-based LLM using `@xenova/transformers` (no cloud dependency) |
| 👥 **Multi-Role RBAC** | Super Admin, Admin, SOC Analyst, Auditor, Compliance Officer, User |
| 🧪 **E2E Test Suite** | Playwright automation tests for auth, vault, and admin workflows |
| 🐳 **Docker Compose** | One-command deployment of all 4 services (MongoDB, AI Engine, Backend, Frontend) |
| 🔗 **MCP Integration** | Model Context Protocol SSE server for AI agent tool access |

---

## 3. Technology Stack

### Backend — Zero Trust Gateway
| Technology | Purpose |
|-----------|---------|
| Node.js 18+ / Express 4 | HTTP API gateway |
| TypeScript 5 | Type safety |
| Mongoose 8 + MongoDB | Primary database |
| JSON file mock DB | Offline fallback (no MongoDB required for demo) |
| JWT (jsonwebtoken) | Stateless authentication tokens |
| bcryptjs | Password hashing |
| helmet, cors | HTTP security headers |
| multer | File upload handling |
| ethers v6 | EVM/blockchain interactions |
| ws (WebSocket) | Real-time event streaming |
| @modelcontextprotocol/sdk | MCP SSE server |
| axios | HTTP client (calls AI engine) |

### AI Engine — FastAPI Microservice
| Technology | Purpose |
|-----------|---------|
| Python 3.9+ | Runtime |
| FastAPI + uvicorn | Async web framework |
| scikit-learn | ML-based UEBA anomaly scoring |
| numpy, pandas | Data processing |
| cryptography | Crypto utilities |
| python-multipart | File upload parsing |

### Frontend — React Dashboard
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool / dev server |
| Tailwind CSS 3 | Utility-first styling |
| framer-motion | Animations |
| react-router-dom v6 | Client-side routing |
| recharts | Interactive charts |
| three.js + @react-three/fiber | 3D globe visualization |
| lucide-react | Icon library |
| @xenova/transformers | In-browser local LLM |
| qrcode.react | QR code generation |
| vite-plugin-pwa | Progressive Web App |

### Blockchain
| Technology | Purpose |
|-----------|---------|
| Hardhat 2.22 | Local EVM development network |
| Solidity 0.8 | Smart contracts |
| ethers v6 + typechain | Contract type-safe bindings |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerized deployment |
| Nginx | Frontend static file serving |
| IPFS / Pinata | Decentralized file storage |
| Playwright | E2E browser automation tests |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              React Frontend (Cyberpunk UI)                   │
│  Dashboard │ Vault │ SOC │ Forensics │ Copilot │ Analytics  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS / WebSockets / JWT
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Express Zero Trust Gateway (Port 5000)             │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌─────────┐  │
│  │ Auth API │ │  Files API   │ │ Admin API │ │ MCP SSE │  │
│  └──────────┘ └──────────────┘ └───────────┘ └─────────┘  │
│       │            │                │                        │
│  zeroTrustGuard (RBAC + ABAC + IP + Session + UEBA)        │
└──┬───────────┬──────────────┬───────────────────────────────┘
   │           │              │
   ▼           ▼              ▼
┌──────┐  ┌────────┐  ┌──────────────┐
│Mongo │  │FastAPI │  │  Hardhat EVM │
│Atlas │  │AI Eng. │  │  (Port 8545) │
│/Mock │  │:8000   │  └──────┬───────┘
└──────┘  └───┬────┘         │
              │         ┌────▼──────────┐
              │         │ FileRegistry  │
              │         │ DecentralID   │
              │         └───────────────┘
              │
         ┌────▼───────────────┐
         │  IPFS / Pinata     │
         │  (or local mock)   │
         └────────────────────┘
```

### Data Flow — Secure File Upload

```
User selects file
      │
      ▼ Frontend
  File sent to POST /api/files/upload (multipart)
      │
      ▼ Backend — Zero Trust Guard
  1. JWT verified → user identity confirmed
  2. IP whitelist check
  3. Session limit check
  4. RBAC role verified
  5. AI UEBA behavioral score evaluated
      │
      ▼ AI Engine (FastAPI :8000)
  POST /api/v1/scan/file
  - Heuristic malware scan
  - Shannon entropy (ransomware)
  - PII regex detection
  - Steganography detection
  → Returns: { threat_score, flags, verdict }
      │
      ▼ Backend — if verdict == CLEAN
  - Generate AES-256-GCM key
  - Encrypt file buffer in memory
  - Wrap AES key with user's RSA-4096 public key
  - Compute SHA-256 hash of plaintext
  - ECDSA-sign the hash
  - Push encrypted buffer to IPFS → get CID
  - Register (fileId, CID, hash, threatScore, sig) on FileRegistry.sol
  - Store metadata in MongoDB (or mock JSON)
      │
      ▼ Response → Frontend
  { fileId, cid, threatScore, blockchainTxHash }
```

---

## 5. Project Directory Structure

```
Aegis-Cyber/
├── ai_engine/                    # Python FastAPI AI microservice
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── routers/
│   │   │   ├── scan.py           # File scanning endpoints
│   │   │   ├── ueba.py           # UEBA behavioral analytics
│   │   │   ├── copilot.py        # AI Copilot Q&A
│   │   │   └── feeds.py          # Threat intelligence feeds
│   │   └── services/
│   │       ├── malware_scanner.py # Heuristic + entropy scanner
│   │       ├── ueba_service.py   # ML anomaly scoring
│   │       └── copilot_service.py # NLP copilot service
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend/                      # Node.js Express Zero Trust Gateway
│   ├── src/
│   │   ├── server.ts             # Main Express server + WebSocket + MCP
│   │   ├── mcpServer.ts          # Model Context Protocol server
│   │   ├── config/
│   │   │   ├── db.ts             # MongoDB connection (with mock fallback)
│   │   │   └── contractAddresses.json  # Deployed contract addresses
│   │   ├── controllers/          # Request handlers
│   │   │   ├── authController.ts # Register, login, wallet, VC
│   │   │   ├── fileController.ts # Upload, download, share
│   │   │   ├── adminController.ts # User management, system health
│   │   │   ├── forensicsController.ts # Timeline, compliance, copilot
│   │   │   ├── agentSwarmController.ts # AI agent swarm
│   │   │   ├── threatOracleController.ts # Threat intelligence
│   │   │   ├── threatTopologyController.ts # Network topology
│   │   │   └── fileAnalyticsController.ts # File analytics
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification middleware
│   │   │   └── zeroTrustGuard.ts # Zero Trust policy enforcement
│   │   ├── models/
│   │   │   ├── User.ts           # Mongoose User schema
│   │   │   ├── FileDocument.ts   # Mongoose FileDocument schema
│   │   │   ├── AuditLog.ts       # Security audit log schema
│   │   │   ├── SessionLog.ts     # Session tracking schema
│   │   │   ├── ThreatReport.ts   # Threat report schema
│   │   │   ├── ThreatIntelligence.ts # Threat intel schema
│   │   │   ├── FileActivity.ts   # File event schema
│   │   │   └── dbMock.ts         # In-memory/JSON file mock DB
│   │   ├── routes/
│   │   │   ├── api.ts            # Main API router
│   │   │   ├── analytics.ts      # Analytics sub-router
│   │   │   └── threats.ts        # Threats sub-router
│   │   ├── services/
│   │   │   ├── blockchainService.ts # Hardhat contract calls
│   │   │   ├── ipfsService.ts    # IPFS / Pinata / local mock
│   │   │   ├── websocketService.ts # Real-time WS broadcasts
│   │   │   ├── agentSwarmService.ts # AI agent orchestration
│   │   │   ├── geoLocationService.ts # IP geolocation
│   │   │   ├── threatOracleService.ts # Live threat feeds
│   │   │   └── threatSimulationService.ts # Threat sim for demo
│   │   └── utils/
│   │       └── cryptoHelper.ts   # AES-GCM / RSA / ECDSA helpers
│   ├── tests/
│   │   └── crypto.test.ts        # Node built-in test runner
│   ├── ipfs_mock/                # Local IPFS file storage mock
│   ├── mock_db_users.json        # Seeded demo users (offline mode)
│   ├── mock_db_files.json        # Seeded demo files
│   ├── mock_db_audits.json       # Seeded audit logs
│   ├── mock_db_sessions.json     # Session records
│   ├── mock_db_activities.json   # File activity events
│   ├── mock_db_threat_intel.json # Threat intelligence entries
│   ├── .env.example              # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── blockchain/                   # Hardhat EVM smart contracts
│   ├── contracts/
│   │   ├── FileRegistry.sol      # File hash registry + access control
│   │   └── DecentralizedID.sol   # DID registry
│   ├── scripts/
│   │   └── deploy.ts             # Hardhat deploy script
│   ├── test/                     # Hardhat contract unit tests
│   ├── hardhat.config.ts
│   ├── package.json
│   └── typechain-types/          # Auto-generated TypeScript bindings
│
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Router + layout
│   │   ├── index.css             # Global styles
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Sidebar + nav layout
│   │   │   └── GlobeScene.tsx    # Three.js 3D globe
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # JWT auth state + refresh
│   │   └── pages/
│   │       ├── Login.tsx         # Login page with quick-fill
│   │       ├── Dashboard.tsx     # SOC overview
│   │       ├── Vault.tsx         # File upload/download vault
│   │       ├── Forensics.tsx     # Audit timeline
│   │       ├── Analytics.tsx     # Charts & metrics
│   │       ├── Compliance.tsx    # GDPR/ISO/NIST scorecards
│   │       ├── Copilot.tsx       # AI Security Copilot chat
│   │       ├── Admin.tsx         # User management
│   │       ├── AgentSwarm.tsx    # AI agent swarm dashboard
│   │       ├── ThreatOracle.tsx  # Live threat intelligence
│   │       ├── ThreatTopology.tsx # Network topology map
│   │       ├── Team.tsx          # Team management
│   │       ├── SharedInbox.tsx   # Received shared files
│   │       ├── PublicShare.tsx   # Public share link page
│   │       ├── FileLifecycle.tsx # File provenance tracking
│   │       ├── LocalLLM.tsx      # On-device LLM interface
│   │       └── llm.worker.ts     # WebWorker for local LLM
│   ├── public/
│   │   └── icon.svg
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── nginx.conf                # Nginx config for Docker
│   ├── package.json
│   └── Dockerfile
│
├── automation/                   # Playwright E2E test suite
│   └── playwright/
│       ├── config/playwright.config.ts
│       ├── fixtures/auth.fixture.ts
│       ├── pages/                # Page Object Model
│       │   ├── LoginPage.ts
│       │   ├── DashboardPage.ts
│       │   ├── VaultPage.ts
│       │   └── AdminPage.ts
│       ├── tests/
│       │   ├── auth.spec.ts
│       │   ├── vault.spec.ts
│       │   └── admin.spec.ts
│       └── utils/testHelpers.ts
│
├── docs/                         # Project documentation
│   ├── architecture/
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   └── ORIGINS.md
│   ├── api/                      # API documentation
│   ├── deployment/               # Deployment guides
│   └── setup/
│       ├── automation.md
│       └── quick_login_bookmarklet.html
│
├── scripts/                      # Developer utilities
│   ├── development/
│   │   └── dev_runner.js         # Concurrent multi-service runner
│   └── create_desktop_shortcut.ps1
│
├── tests/                        # Integration tests
│   ├── e2e/
│   └── integration/
│
├── .env.example                  # Root environment template
├── .gitignore
├── docker-compose.yml            # Docker multi-service orchestration
├── package.json                  # Root workspace scripts
├── package-lock.json
├── run_all.bat                   # Windows quick-start batch
├── START_AEGIS.vbs               # Windows VBScript launcher
└── README.md
```

---

## 6. Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Node.js | 18.x LTS | Required for backend and blockchain |
| npm | 9.x | Bundled with Node.js |
| Python | 3.9+ | Required for AI engine |
| pip | 22+ | Bundled with Python |
| MongoDB | 6.x | Optional — mock DB works without it |
| Docker + Docker Compose | 24.x | Only required for container deployment |
| Git | 2.x | Version control |

**Optional:**
- MetaMask or any EVM wallet (for on-chain DID linking)
- Pinata account (for real IPFS pinning; local mock is used by default)

---

## 7. Installation & Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/VAST-CSE/2023-27-MAIN-C8-YADUKRISHNAN-NK.git
cd 2023-27-MAIN-C8-YADUKRISHNAN-NK
```

### Step 2 — Blockchain Setup

```bash
cd blockchain
npm install

# Compile Solidity smart contracts
npm run compile

# In a dedicated terminal — keep this running
npm run node
```

### Step 3 — Deploy Smart Contracts

In a new terminal (blockchain node must be running from Step 2):

```bash
cd blockchain
npm run deploy:local
```

> This deploys `FileRegistry.sol` and `DecentralizedID.sol` to the local Hardhat network and writes the addresses to `backend/src/config/contractAddresses.json`.

### Step 4 — AI Engine Setup

```bash
cd ai_engine

# Create and activate Python virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server (port 8000)
python app/main.py
```

### Step 5 — Backend Gateway Setup

```bash
cd backend
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your values (JWT_SECRET is mandatory)

# Start development server (port 5000)
npm run dev
```

> **Note:** If MongoDB is not running, the backend automatically activates the built-in JSON file mock database. All demo credentials and seeded data are pre-loaded.

### Step 6 — Frontend Setup

```bash
cd frontend
npm install

# Start Vite development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Start (All Services at Once)

From the project root, after installing all dependencies:

```bash
npm run dev
```

This uses `scripts/development/dev_runner.js` to launch the backend and frontend concurrently.

**Windows users** can also double-click `run_all.bat` or `START_AEGIS.vbs`.

---

## 8. Environment Configuration

Copy the template and set your values:

```bash
cp .env.example backend/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 32 chars) |
| `MONGO_URI` | No | `mongodb://127.0.0.1:27017/cyber_defense_platform` | MongoDB connection |
| `AI_ENGINE_URL` | No | `http://127.0.0.1:8000` | FastAPI microservice URL |
| `PINATA_API_KEY` | No | — | Pinata IPFS API key |
| `PINATA_SECRET_API_KEY` | No | — | Pinata secret key |
| `PINATA_GATEWAY_URL` | No | `https://gateway.pinata.cloud` | Pinata gateway |
| `HARDHAT_RPC_URL` | No | `http://127.0.0.1:8545` | Hardhat EVM RPC |
| `DEPLOYER_PRIVATE_KEY` | No | Hardhat test key | Contract deployer key |

> **Security Note:** Never commit `.env` files. The `.gitignore` excludes them. Use the `.env.example` as reference only.

---

## 9. Running the Application

### Development Mode

```bash
# Root (backend + frontend concurrently)
npm run dev

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# AI Engine only
npm run dev:ai
```

### Production Build

```bash
# Build backend (TypeScript → JavaScript)
npm run build:backend

# Build frontend (Vite production bundle)
npm run build:frontend

# Build both
npm run build
```

### Start Production Servers

```bash
# Backend (after build)
cd backend && npm start

# Frontend (preview Vite build)
cd frontend && npm run preview
```

### Health Check

```bash
npm run health
# → Backend Health: 200 {"status":"healthy","timestamp":"..."}
```

---

## 10. Database Setup

### MongoDB (Optional)

The backend auto-detects MongoDB availability at startup. If MongoDB is **not running**, it activates the **JSON file mock database** automatically — no configuration needed for development or demos.

**Start MongoDB locally:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows (service)
net start MongoDB

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Atlas connection (production):**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cyber_defense_platform
```

### Seeded Demo Data

The following mock JSON files provide pre-seeded data for offline mode:

| File | Contents |
|------|---------|
| `backend/mock_db_users.json` | Demo users with roles and RSA keys |
| `backend/mock_db_files.json` | Sample encrypted file records |
| `backend/mock_db_audits.json` | Audit log entries |
| `backend/mock_db_sessions.json` | Session records |
| `backend/mock_db_activities.json` | File activity events |
| `backend/mock_db_threat_intel.json` | Threat intelligence entries |

---

## 11. API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register user, generate RSA key pair |
| POST | `/auth/login` | None | Authenticate and receive JWT |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | JWT | Invalidate session |
| POST | `/auth/wallet` | JWT | Link EVM wallet address + register DID |
| POST | `/auth/issue-vc` | JWT + Admin | Issue Verifiable Credential |
| POST | `/auth/verify-vc` | JWT | Verify a Verifiable Credential |

#### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Aegis@Admin2026!"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "username": "admin",
    "role": "Super Admin"
  }
}
```

### File Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/files/list` | JWT | List own files |
| GET | `/files/shared-with-me` | JWT | List files shared with me |
| POST | `/files/upload` | JWT | Upload + scan + encrypt + store to IPFS |
| GET | `/files/download/:fileId` | JWT | Decrypt + download file |
| POST | `/files/share` | JWT | Share file with time/download limits |
| POST | `/files/generate-share-link` | JWT | Generate public share link with QR |
| GET | `/files/public-share/:shareToken` | None | Get public share metadata |
| GET | `/files/public-download/:shareToken` | None | Download via public share link |

#### File Upload Example

```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@/path/to/document.pdf"
```

```json
{
  "message": "File uploaded successfully",
  "file": {
    "_id": "...",
    "fileName": "document.pdf",
    "cid": "QmXxx...",
    "blockchainTxHash": "0xabc...",
    "threatScore": 2
  }
}
```

### Forensics & SOC

| Method | Endpoint | Auth / Roles | Description |
|--------|----------|--------------|-------------|
| GET | `/forensics/timeline` | JWT + SOC/Admin | Security event timeline |
| GET | `/compliance/report` | JWT + Auditor/Admin | GDPR/ISO/NIST scorecard |
| POST | `/copilot/query` | JWT | AI Copilot natural language query |

### Admin

| Method | Endpoint | Auth / Roles | Description |
|--------|----------|--------------|-------------|
| GET | `/admin/system-health` | JWT + Admin | System health metrics |
| GET | `/admin/users` | JWT + Admin | List all users |
| POST | `/admin/update-role` | JWT + Super Admin | Change user role |
| POST | `/admin/update-ip` | JWT + Admin | Update IP whitelist |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/*` | JWT | File analytics, event stats, top users |

### Threats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/threats/*` | JWT | Threat topology, oracle feeds, simulation |

### AI Engine (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scan/file` | Scan file for malware, PII, entropy |
| POST | `/api/v1/ueba/evaluate` | Evaluate user behavioral risk score |
| POST | `/api/v1/copilot/query` | AI security copilot Q&A |
| GET | `/api/v1/feeds/threats` | Live threat intelligence feeds |

### WebSocket (Port 5000)

Connect to `ws://localhost:5000` after JWT authentication to receive real-time events:
- `THREAT_ALERT` — new threat detected
- `FILE_UPLOADED` — file processed
- `SECURITY_ALERT` — Zero Trust block event
- `SESSION_EVENT` — login/logout activity

### MCP (Model Context Protocol)

- **SSE endpoint:** `GET /sse` — establish SSE session
- **Messages:** `POST /messages?sessionId=<id>` — send MCP tool calls

---

## 12. Authentication & Security

### JWT Authentication Flow

1. Client POSTs credentials to `/api/auth/login`
2. Server verifies password hash (bcrypt), creates session record, issues JWT
3. Client stores JWT and sends as `Authorization: Bearer <token>` header
4. `authenticateJWT` middleware verifies and decodes token on every protected route
5. `zeroTrustGuard` middleware applies additional checks (see below)

### Zero Trust Guard — Policy Checks

Every authenticated API request passes through these checks in order:

1. **Identity Verification** — JWT decoded user must exist
2. **IP Whitelist** — If user has IP restrictions, client IP must match
3. **Concurrent Session Limit** — Max 10 concurrent sessions per user
4. **RBAC** — Role must match required roles for the endpoint
5. **ABAC Time Lock** — Auditor/Guest roles blocked outside 8AM–8PM
6. **AI UEBA Score** — Behavioral score ≥ 70/100 triggers MFA challenge or block

> If the AI Engine is unavailable, the UEBA check fails open (monitoring-only mode) to prevent service disruption.

### Encryption Architecture

```
File Upload:
  plaintext → AES-256-GCM encrypt → ciphertext
  AES key   → RSA-4096-OAEP wrap → encryptedAesKey (stored in DB)
  hash      → ECDSA sign          → digitalSignature (recorded on chain)

File Download:
  encryptedAesKey → RSA-4096 unwrap → AES key
  ciphertext      → AES-256-GCM decrypt → plaintext
  blockchainHash  → verify against computed hash
```

### Security Headers

- **Helmet.js** — sets `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.
- **CORS** — configurable origin list (set to `*` in dev, restrict in production)

---

## 13. Blockchain & Smart Contracts

### Contracts

| Contract | Purpose |
|----------|---------|
| `FileRegistry.sol` | Stores file CID, SHA-256 hash, threat score, ECDSA signature, and per-user access grants with time and download limits |
| `DecentralizedID.sol` | Maps EVM wallet addresses to DID URIs and RSA public keys |

### FileRegistry Functions

```solidity
registerFile(fileId, cid, fileHash, threatScore, signature)
grantAccess(fileId, accessor, duration, maxDownloads)
revokeAccess(fileId, accessor)
verifyAccess(fileId, accessor) → bool
setEmergencyLock(state)
```

### Local Development

```bash
cd blockchain
npm run node           # Start Hardhat node (port 8545)
npm run deploy:local   # Deploy contracts, write addresses to backend config
npm run compile        # Recompile after contract changes
npm test               # Run Hardhat contract tests
```

---

## 14. Testing

### Backend Unit Tests (Node.js built-in test runner)

```bash
cd backend
npm test
# Runs: node --test tests/crypto.test.ts
# Tests: AES-256-GCM encryption/decryption, RSA key generation, key wrapping
```

### Blockchain Contract Tests (Hardhat/Mocha)

```bash
cd blockchain
npm test
# Requires: Hardhat node running or Hardhat in-process network
```

### E2E Browser Tests (Playwright)

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test automation/playwright/tests/auth.spec.ts

# View test report
npx playwright show-report
```

E2E test scenarios:
- `auth.spec.ts` — Login with all 3 demo roles, logout, invalid credentials
- `vault.spec.ts` — File upload, download, share flow
- `admin.spec.ts` — Admin user management, role update

> **Note:** E2E tests require all services running (backend on :5000, frontend on :3000).

### Linting & Type Checking

```bash
# Backend TypeScript check
cd backend
npx tsc --noEmit

# Frontend TypeScript check  
cd frontend
npx tsc --noEmit

# Frontend build (includes tsc)
npm run build
```

---

## 15. Deployment (Docker)

### Start All Services

```bash
docker-compose up --build
```

This starts:
| Container | Port | Service |
|-----------|------|---------|
| `aegis_mongodb` | 27017 | MongoDB |
| `aegis_ai_engine` | 8000 | FastAPI AI Engine |
| `aegis_backend` | 5000 | Express Gateway |
| `aegis_frontend` | 3000 | Nginx + React |

### Stop Services

```bash
docker-compose down
```

### Production Considerations

- Change `JWT_SECRET` to a secure random value (min 64 chars)
- Restrict CORS `origin` to your actual domain
- Set `MONGO_URI` to a production Atlas URI with authentication
- Configure Pinata API keys for real IPFS pinning
- Use HTTPS (terminate TLS at load balancer or nginx)
- Set `contentSecurityPolicy: true` in helmet config
- Deploy Solidity contracts to a real EVM testnet or mainnet

---

## 16. Demo Credentials

> These credentials are pre-seeded in `backend/mock_db_users.json`. The login page also has Quick Demo buttons for one-click fill.

| Role | Username | Password | Access Level |
|------|----------|----------|-------------|
| **Super Admin** | `admin` | `Aegis@Admin2026!` | Full system access, user management, role changes |
| **SOC Analyst** | `secoperator` | `Operator@2026!` | SOC dashboard, threat simulation, telemetry |
| **Standard User** | `testuser` | `TestUser@2026!` | Secure file vault, sharing, P2P encryption |

Alternative credentials also work:
- `admin` / `admin`
- `demo` / `demo123`

---

## 17. Current Limitations & Roadmap

### Current Limitations

| Area | Limitation |
|------|-----------|
| IPFS | Local file mock used by default; real Pinata requires API keys |
| Blockchain | Hardhat local network only; no public testnet deployment |
| PQC | Kyber-1024 is simulated, not a production-grade implementation |
| UEBA | ML model is rule-based + heuristic; not trained on real telemetry |
| MFA | MFA challenge is flagged but not fully implemented as a second factor |
| Geolocation | IP geolocation uses a fixed Bangalore coordinate in dev mode |
| Local LLM | Performance depends on device; large models may be slow in browser |

### Planned Enhancements

- [ ] Deploy contracts to Polygon Mumbai or Sepolia testnet
- [ ] Real Kyber-1024 PQC implementation via `liboqs`
- [ ] TOTP/WebAuthn second-factor authentication
- [ ] Real-time threat feed integration (VirusTotal, OTX, Shodan)
- [ ] Kubernetes Helm chart for cloud deployment
- [ ] Trained UEBA model on synthetic behavioral datasets
- [ ] File versioning with delta encryption
- [ ] Multi-party file ownership with threshold signatures
- [ ] Audit report PDF export

---

## 18. Contributors

| Name | Role |
|------|------|
| Yadukrishnan NK | Lead Developer — Architecture, Backend, Blockchain, AI Engine |

**Academic Context:** B.Tech Computer Science & Engineering (Cybersecurity), Batch 2023–27, VAST College of Engineering, under project code C8.

---

## 19. License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Yadukrishnan NK

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```
