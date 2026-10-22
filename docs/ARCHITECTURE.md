# Aegis Cyber — Architecture Documentation

## Overview

Aegis Cyber is a polyglot, microservice-based cybersecurity platform composed of four main services communicating over HTTP, WebSockets, and JSON-RPC.

---

## Service Map

```
┌───────────────────────────────────────────────────────────────────┐
│                    Client Browser (Port 3000)                     │
│          React 18 + TypeScript + Tailwind + Vite/Nginx            │
│                                                                    │
│  Pages: Login │ Dashboard │ Vault │ Forensics │ Analytics         │
│         Compliance │ Copilot │ Admin │ AgentSwarm │ ThreatOracle  │
│         ThreatTopology │ Team │ SharedInbox │ LocalLLM            │
└────────────────────────────┬──────────────────────────────────────┘
                             │ REST (JWT Bearer) + WebSocket
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│              Express Zero Trust Gateway (Port 5000)               │
│                                                                    │
│  Middleware Stack:                                                 │
│   helmet → cors → express.json → authenticateJWT → zeroTrustGuard│
│                                                                    │
│  Routers:                                                         │
│   /api/auth      /api/files     /api/admin                        │
│   /api/forensics /api/analytics /api/threats                      │
│   /api/copilot   /sse (MCP)     /messages (MCP)                   │
│   WS broadcast   /health                                           │
│                                                                    │
│  Services:                                                         │
│   blockchainService  ipfsService     websocketService             │
│   agentSwarmService  geoLocationSvc  threatOracleService          │
│   threatSimulationSvc                                              │
└────┬──────────────┬──────────────┬────────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────────────────┐
│ MongoDB │  │ FastAPI  │  │   Hardhat EVM        │
│  :27017 │  │ AI Eng.  │  │   :8545              │
│  or     │  │  :8000   │  │                      │
│  JSON   │  │          │  │  FileRegistry.sol    │
│  Mock   │  │ /scan    │  │  DecentralizedID.sol │
└─────────┘  │ /ueba    │  └──────────┬───────────┘
             │ /copilot │             │
             │ /feeds   │        IPFS / Pinata
             └──────────┘        or Local Mock
```

---

## Component Details

### 1. React Frontend

**Entry:** `frontend/src/main.tsx` → `App.tsx`

**Routing (react-router-dom v6):**
```
/login             → Login.tsx
/                  → Dashboard.tsx       (protected)
/vault             → Vault.tsx           (protected)
/forensics         → Forensics.tsx       (protected, SOC+)
/analytics         → Analytics.tsx       (protected)
/compliance        → Compliance.tsx      (protected, Auditor+)
/copilot           → Copilot.tsx         (protected)
/admin             → Admin.tsx           (protected, Admin+)
/agent-swarm       → AgentSwarm.tsx      (protected)
/threat-oracle     → ThreatOracle.tsx    (protected)
/threat-topology   → ThreatTopology.tsx  (protected)
/team              → Team.tsx            (protected)
/shared-inbox      → SharedInbox.tsx     (protected)
/public-share/:id  → PublicShare.tsx     (public)
/file-lifecycle    → FileLifecycle.tsx   (protected)
/local-llm         → LocalLLM.tsx        (protected)
```

**Auth State:** `AuthContext.tsx` holds JWT, user object, and auto-refresh logic. Persists to `localStorage`.

**Real-time:** Frontend opens a WebSocket connection to `ws://localhost:5000` and listens for broadcast events to update the SOC dashboard live.

---

### 2. Express Zero Trust Gateway

**Entry:** `backend/src/server.ts`

**Database Strategy:**
- On startup, `connectDB()` attempts MongoDB with a 3-second timeout.
- If MongoDB is unavailable: `isDbOffline = true`, all models switch to `MockXxx` classes from `dbMock.ts`.
- Mock DB reads/writes JSON files in `backend/mock_db_*.json` — fully persistent across restarts.

**Zero Trust Guard (`zeroTrustGuard.ts`):**
```
Request arrives
   ↓
1. JWT decoded user present?          → 401 if not
   ↓
2. IP in user's whitelist?            → 403 if blocked
   ↓
3. Active sessions ≤ 10?             → 403 if exceeded
   ↓
4. Role in requiredRoles[]?           → 403 if wrong role
   ↓
5. ABAC: Auditor within 8AM–8PM?     → 403 if outside hours
   ↓
6. AI UEBA score < 70?               → 403 + requireMfa if high risk
   ↓
next() — request proceeds
```

**Crypto Helper (`utils/cryptoHelper.ts`):**
- `generateKeyPair()` — RSA-4096 OAEP (stored in DB as SPKI PEM)
- `encryptFile(buffer, publicKeyPem)` — AES-256-GCM, wraps key with RSA
- `decryptFile(encrypted, privateKeyPem)` — unwraps key, decrypts buffer
- `signHash(hash, privateKey)` — ECDSA signature
- `verifySignature(hash, sig, publicKey)` — ECDSA verification

---

### 3. FastAPI AI Engine

**Entry:** `ai_engine/app/main.py`

**Routers:**

| Router | Prefix | Key Function |
|--------|--------|-------------|
| `scan.py` | `/api/v1/scan` | `POST /file` — full file threat analysis |
| `ueba.py` | `/api/v1/ueba` | `POST /evaluate` — behavioral risk score |
| `copilot.py` | `/api/v1/copilot` | `POST /query` — NLP security Q&A |
| `feeds.py` | `/api/v1/feeds` | `GET /threats` — threat intelligence |

**Malware Scanner (`malware_scanner.py`):**
1. Header/magic byte signature matching (PE, ELF, shell patterns)
2. Shannon entropy calculation — H > 7.2 flags packed/encrypted binary
3. Regex PII scan — SSN (`\d{3}-\d{2}-\d{4}`), Aadhaar, PAN, credit card, passport
4. Steganography — detects ZIP PKHeader after JPEG/PNG EOF marker
5. MITRE ATT&CK tag mapping based on detected patterns

**UEBA Service (`ueba_service.py`):**
- Inputs: IP, geolocation, biometrics (keystroke hold, mouse jitter), device fingerprint, previous session
- Scoring: cumulative risk point system
- Outputs: `risk_score` (0–100), `action` (`ALLOW` / `REQUIRE_MFA_CHALLENGE`), `reasons[]`

---

### 4. Hardhat EVM (Blockchain)

**`FileRegistry.sol`:**
```
State:
  mapping(bytes32 => FileRecord) files
  mapping(bytes32 => mapping(address => AccessGrant)) accessGrants

FileRecord:
  string cid, string fileHash, uint256 threatScore,
  bytes signature, address owner, bool exists, bool locked

AccessGrant:
  bool granted, uint256 validUntil, uint256 maxDownloads,
  uint256 downloadCount
```

**`DecentralizedID.sol`:**
```
State:
  mapping(address => DIDRecord) dids

DIDRecord:
  string didUri, string publicKey, bool registered
```

**Deploy flow (`scripts/deploy.ts`):**
1. Deploy both contracts
2. Write addresses + ABIs to `backend/src/config/contractAddresses.json`
3. Backend `blockchainService.ts` reads this file at startup

---

## Data Flow Diagrams

### Authentication Flow

```
Client                    Backend                   Database
  │                          │                          │
  │── POST /api/auth/login ──►│                          │
  │   {username, password}   │── findOne({username}) ──►│
  │                          │◄─ user record ───────────│
  │                          │── bcrypt.compare() ──────│
  │                          │── SessionLog.create() ───►│
  │                          │── jwt.sign(userId, role) │
  │◄─ {token, user} ─────────│                          │
```

### File Upload Flow

```
Client          Backend              AI Engine          IPFS/Chain/DB
  │                │                     │                   │
  │─ POST /upload ►│                     │                   │
  │   multipart    │─ POST /scan/file ──►│                   │
  │                │◄─ {score, verdict} ─│                   │
  │                │─ AES-256-GCM encrypt                    │
  │                │─ RSA wrap AES key                       │
  │                │─ ECDSA sign hash                        │
  │                │─────────────────────────── push ───────►│ IPFS
  │                │◄──────────────────────────── CID ───────│
  │                │─────────────────────────── register ───►│ Chain
  │                │◄──────────────────────────── txHash ────│
  │                │─────────────────────────── save ───────►│ DB
  │◄─ {cid, txHash}│                                        │
```

---

## Security Architecture

### Defense-in-Depth Layers

```
Layer 1 (Network):    CORS policy, Helmet HTTP headers, IP whitelisting
Layer 2 (Identity):   JWT verification, RSA key binding
Layer 3 (Session):    Concurrent session limits, session invalidation
Layer 4 (Role):       RBAC (6 roles), ABAC (time-lock policies)
Layer 5 (Behavior):   AI UEBA scoring, biometric anomaly detection
Layer 6 (Content):    AI malware scan, PII detection, entropy analysis
Layer 7 (Storage):    AES-256-GCM encryption, RSA key wrapping
Layer 8 (Integrity):  ECDSA signatures, blockchain hash verification
Layer 9 (Audit):      Full audit log for all security events
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mock DB fallback | JSON files | Zero-dependency demo mode; works without MongoDB |
| IPFS fallback | Local filesystem | Demo without Pinata account |
| Encryption | AES-256-GCM + RSA-4096 | NIST-approved, browser-compatible |
| Blockchain | Hardhat local | Simple setup, no testnet ETH needed for dev |
| Frontend bundler | Vite 5 | Fast HMR, native ESM, PWA plugin support |
| Local LLM | @xenova/transformers | No server, privacy-preserving, WebWorker-isolated |
| Real-time | ws (native WS) | Lightweight, no Socket.IO overhead |
| MCP | @modelcontextprotocol/sdk | AI agent tool access for Copilot integration |
