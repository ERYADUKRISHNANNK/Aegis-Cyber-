# AEGIS CYBER SHIELD
## AI-Powered Secure Decentralized File Sharing & Cyber Defense Platform
### Full Implementation Plan & Documentation

---

# 1. INTRODUCTION

## 1.1 Background

In an era of escalating cyber threats, organizations face an unprecedented challenge in securing sensitive data while maintaining operational agility. Traditional centralized file sharing systems present single points of failure, vulnerable to both external attacks and insider threats. The 2023 IBM Cost of a Data Breach Report reveals that the global average cost of a data breach reached $4.45 million. Decentralized storage solutions like IPFS offer resilience against single-point failures, but lack native encryption, access control, and forensic audit capabilities.

The convergence of blockchain-based integrity verification, AI-powered threat analysis, and zero-trust architecture represents a paradigm shift in how organizations protect their digital assets.

## 1.2 Problem Statement

Existing file sharing platforms suffer from critical deficiencies:

- **Centralized Trust Models**: Perimeter-based security fails against APTs and lateral movement attacks
- **Lack of End-to-End Encryption**: Cloud-stored files vulnerable to server-side breaches
- **Absent Forensic Auditability**: No immutable audit trails for legal/regulatory compliance
- **Static Access Control**: RBAC alone cannot account for behavioral or geographic anomalies
- **No Threat Intelligence Integration**: File sharing isolated from security monitoring
- **Manual Compliance Management**: GDPR/ISO/NIST tracking is error-prone

## 1.3 Objectives

1. **Zero Trust Architecture**: Continuous verification via identity, biometrics, geo-location, and risk scoring
2. **Hybrid Encryption**: AES-256-GCM + RSA-4096 key wrapping for zero-knowledge storage
3. **Blockchain Integrity**: Smart contract registration of hashes, signatures, and permissions
4. **AI Threat Analysis**: Multi-stage scanning with MITRE ATT&CK mapping
5. **Decentralized Storage**: IPFS with Pinata cloud + local mock fallback
6. **Real-time Monitoring**: WebSocket threat alerts and live activity feeds
7. **Automated Compliance**: GDPR, ISO 27001, NIST CSF real-time scoring
8. **File Provenance**: Complete lifecycle visibility with geographic attribution

## 1.4 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|--------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts | Cyberpunk UI |
| Backend | Express.js, TypeScript, JWT, Multer | Zero Trust Gateway |
| AI Engine | Python 3.9+, FastAPI, scikit-learn | Threat analysis |
| Blockchain | Solidity, Hardhat, ethers.js | Smart contracts |
| Database | MongoDB + Mock DB fallback | Metadata storage |
| Storage | IPFS (Pinata Cloud) | Decentralized files |
| Real-time | WebSocket (ws) | Event streaming |
| AI Protocol | MCP SDK | LLM tool integration |
| Crypto | Node.js crypto | AES-256-GCM, RSA-4096, ECDSA |

---

# 2. LITERATURE REVIEW

## 2.1 Zero Trust Architecture

Rose et al. (2020) defined Zero Trust as a set of cybersecurity paradigms that move defenses from static, network-based perimeters to focus on users, assets, and resources. The NIST Special Publication 800-207 established the foundational Zero Trust Architecture (ZTA) framework, advocating for continuous verification of all network traffic regardless of location. Aegis implements this through the zeroTrustGuard middleware enforcing: (1) JWT identity verification, (2) IP whitelisting, (3) concurrent session detection with stale cleanup, (4) RBAC+ABAC policy evaluation, (5) behavioral biometric scoring via keystroke dynamics and mouse jitter, and (6) AI-driven UEBA risk evaluation on every request.

## 2.2 Decentralized File Storage (IPFS)

Benet (2014) introduced IPFS as a peer-to-peer hypermedia protocol using content-addressing where files are identified by cryptographic hash (CID) rather than location-based URLs, providing natural deduplication and tamper evidence. Aegis integrates IPFS through ipfsService supporting Pinata Cloud pinning for production and local mock fallback. Each upload generates a unique CID recorded on the blockchain, creating an immutable link between decentralized storage and on-chain integrity.

## 2.3 Blockchain-based Data Integrity

Androulaki et al. (2018) demonstrated in Hyperledger Fabric that permissioned blockchain networks provide verifiable audit trails for enterprise applications. Aegis implements dual smart contracts: (1) FileRegistry.sol for file metadata, hashes, CIDs, threat scores, and signatures; (2) DecentralizedID.sol for decentralized identity. Hardhat provides local EVM simulation with graceful fallback to in-memory ledger. Each upload triggers registerFile() on-chain; each download triggers verifyAccess() for chain-of-custody validation.

## 2.4 Hybrid Encryption Systems

Song et al. (2017) proposed combining symmetric and asymmetric cryptography for cloud storage security. Aegis implements: (1) AES-256-GCM authenticated encryption per file; (2) RSA-4096 OAEP key wrapping with SHA-256; (3) ECDSA digital signatures; (4) Post-Quantum Cryptography readiness via simulated Kyber-1024 KEM. This hybrid approach ensures that even if AES keys are compromised, RSA wrapping prevents decryption without the private key, while blockchain anchoring provides mathematical proof of integrity.

## 2.5 AI-Powered Threat Detection

Apruzzese et al. (2023) surveyed ML in cybersecurity, finding AI-driven approaches outperform signature-based methods for novel attacks. Aegis implements multi-stage AI analysis via FastAPI: (1) Heuristic malware/trojan detection; (2) Shannon entropy analysis for packed ransomware; (3) Regex PII scanning (SSN, credit cards, Aadhaar, passports); (4) Steganography detection matching ZIP headers in JPEG/PNG; (5) MITRE ATT&CK mapping; (6) UEBA continuous session risk scoring.

## 2.6 User and Entity Behavior Analytics (UEBA)

Bass (2005) established multi-sensor data fusion for intrusion detection, evolving into modern UEBA. Aegis UEBA through zeroTrustGuard analyzes: (1) Keystroke hold duration averages; (2) Mouse velocity and jitter indices; (3) Browser fingerprint consistency; (4) Geographic velocity for impossible travel; (5) Concurrent session monitoring; (6) Device trust metrics. The AI Engine evaluates these against user baselines returning risk scores (0-100), triggering MFA at threshold 70+.

## 2.7 Security Operations Center (SOC) Dashboards

Buchanan (2020) emphasized real-time visualization for reducing MTTD and MTTR. Aegis SOC dashboard provides: (1) Real-time WebSocket threat streams; (2) Interactive Recharts visualizations; (3) Dynamic compliance scorecards (GDPR Art 32/33, ISO 27001 A.8, NIST CSF PR.AC); (4) AI Security Copilot for natural language queries; (5) Threat Topology Map with global attack vectors; (6) Predictive Threat Oracle with 72-hour forecasting.

## 2.8 Model Context Protocol (MCP)

The Model Context Protocol by Anthropic standardizes AI agent access to external tools. Aegis implements MCP via @modelcontextprotocol/sdk exposing 9 tools: get_security_alerts, get_audit_logs, query_blockchain_metadata, get_file_provenance, get_file_analytics, get_global_activity, run_agent_swarm, get_threat_forecast, and get_global_threat_map. This enables any MCP-compatible LLM to query the platform through standardized JSON-RPC over SSE transport.

## 2.9 Multi-Agent Systems for Cybersecurity

Langley (2000) established multi-agent foundations where autonomous agents collaborate on complex problems. Aegis implements 4-agent swarm: (1) Scanner for proactive threat detection; (2) Responder for automated incident response with severity escalation; (3) Forensics for chain-of-custody and geographic anomaly detection; (4) Compliance for GDPR/ISO/NIST assessment. The orchestrator runs all agents in parallel aggregating findings into unified reports.

## 2.10 File Provenance and Digital Forensics

Carrier and Spafford (2003) established forensic investigation principles requiring complete chain-of-custody documentation. Aegis extends this through: (1) Upload origin capture with IP geolocation, device fingerprint, user agent; (2) Every operation logged with actor identity and coordinates; (3) Blockchain transaction anchoring for tamper-evident trails; (4) Self-destruct lifecycle for sensitive documents; (5) PDF forensic watermarking with decryptor identity; (6) Version number tracking for file evolution.

---

# 3. PROPOSED SYSTEM

## 3.1 System Overview

Aegis Cyber Shield is an enterprise-grade, AI-powered decentralized file sharing and cyber defense platform combining Zero Trust Architecture, hybrid encryption, blockchain integrity verification, and multi-agent threat analysis into a unified SOC dashboard.

The system operates across five interconnected layers:

1. **Presentation Layer** (React): Cyberpunk dashboard with 15+ specialized pages
2. **Gateway Layer** (Express.js): Zero Trust API gateway with continuous authentication
3. **Intelligence Layer** (FastAPI): Multi-stage file scanning and UEBA evaluation
4. **Integrity Layer** (EVM): Smart contract file registry and DID management
5. **Storage Layer** (IPFS): Content-addressed decentralized file storage

## 3.2 Key Features

### 3.2.1 Zero Trust Gateway

Every request passes through: JWT Verification -> IP Whitelist Check -> Session Limit Enforcement -> RBAC/ABAC Policy -> UEBA Behavioral Scoring -> AI Risk Assessment

- JWT Authentication: Access tokens (2h) + refresh tokens (7d) with rotation
- Session Management: Concurrent detection with stale session cleanup
- IP Whitelisting: Per-user allowlists with private IP bypass
- ABAC Time Restrictions: Auditor/Guest restricted to business hours
- Biometric Telemetry: Keystroke dynamics + mouse jitter via HTTP headers

### 3.2.2 Hybrid Encryption

Upload: plaintext -> AES-256-GCM(fileKey) -> ciphertext + authTag
        fileKey -> RSA-4096-OAEP(user.publicKey) -> wrappedKey
        SHA-256(ciphertext) -> fileHash (blockchain anchor)
        ECDSA.sign(fileHash, user.privateKey) -> signature

Download: RSA unwrap -> AES decrypt -> SHA-256 verify -> serve

### 3.2.3 AI Security Engine

Five analysis modules: (1) Malware Scanner, (2) Shannon Entropy Analyzer, (3) PII Detector (SSN, credit cards, Aadhaar, passports), (4) Steganography Detector, (5) UEBA Evaluator

### 3.2.4 Blockchain Integrity

- FileRegistry.sol: registerFile(), grantAccess(), revokeAccess(), verifyAccess(), setEmergencyLock()
- DecentralizedID.sol: registerDID(), getDID()
- Hardhat EVM with in-memory ledger fallback

### 3.2.5 File Provenance Tracking

Every operation generates FileActivity with: event type, actor identity, IP+geo, device fingerprint, recipient, expiry, blockchain tx hash, success/failure status.

FileDocument maintains: totalDownloads, totalShares, uniqueViewerCount, uploadIpAddress, uploadGeoLocation, lastAccessedBy, versionNumber, parentFileId.

### 3.2.6 Agent Swarm (4 Agents)

| Agent | Role | Scope |
|-------|------|-------|
| Scanner | Threat Detection | High-threat files, failed downloads, expired shares |
| Responder | Incident Response | Active threats, brute force, emergency lockdown |
| Forensics | Investigation | Blockchain integrity, geo anomalies, chain of custody |
| Compliance | Regulatory | GDPR Art 32, ISO 27001 A.8, NIST CSF PR.AC |

### 3.2.7 Threat Oracle (72-hour Forecast)

8 threat patterns (Ransomware, DDoS, Phishing, DataExfil, BruteForce, ZeroDay, SupplyChain, Insider) with hour-of-day/weekend seasonality, geographic bias, confidence scoring, and threat weather visualization.

### 3.2.8 File Sharing Features

- **Shared Inbox**: View/manage files shared with status badges (Active/Expired/Limited)
- **QR Code Sharing**: Token-based public links with qrcode.react rendering
- **Toast Notifications**: Slide-in auto-dismiss replacing blocking alert() dialogs
- **Public Share Page**: Token-based access without authentication

## 3.3 API Endpoints

**Authentication:** POST /register, /login, /refresh, /logout, /wallet, /issue-vc, /verify-vc
**Files:** GET /list, POST /upload, GET /download/:id, POST /share, GET /shared-with-me, POST /generate-share-link, GET /public-share/:token, GET /public-download/:token
**Intelligence:** GET /analytics/*, GET /threats/*, GET /forensics/timeline, GET /compliance/report, POST /copilot/query
**Admin:** GET /system-health, /users, POST /update-role, /update-ip
**MCP:** GET /sse, POST /messages

## 3.4 Data Models

**User**: username, passwordHash(bcrypt), email, role(enum 8 roles), didAddress, rsaPublicKey, rsaPrivateKeyEncrypted, fingerprintBase, biometricsCadence, whitelistedIps, refreshTokens, active

**FileDocument**: fileName, fileSize, mimeType, cid(IPFS), fileHash(SHA-256), owner, threatScore(0-100), encryptedAesKey(RSA-wrapped), iv(hex), digitalSignature(ECDSA), blockchainTxHash, sharedWith[{accessor, validUntil, maxDownloads, downloadCount, shareToken, isPublicLink}], uploadIpAddress, uploadGeoLocation, totalDownloads, totalShares, uniqueViewerCount, versionNumber, parentFileId

**FileActivity**: fileId, fileName, eventType(UPLOAD/DOWNLOAD/SHARE/ACCESS_CHECK/SELF_DESTRUCT), performedBy, ipAddress, geoLocation{city,country,lat,lon,isp}, success, failureReason, blockchainTxHash, metadata

**ThreatIntelligence**: eventType, severity, sourceIp/Geo, targetIp/Geo, threatScore, confidence, mitreTactic, mitreTechnique, description, isActive, tags

---

# 4. SYSTEM DESIGN

## 4.1 Architecture Diagram

The system follows a 5-layer architecture:

**Presentation Layer** (React, Port 3000): Dashboard, Vault, Forensics, ThreatMap, AgentSwarm, SharedInbox, Analytics, Compliance, Oracle, Copilot pages. AuthContext handles JWT + Biometrics + Wallet + Token Refresh.

**Gateway Layer** (Express.js, Port 5000): Zero Trust Pipeline: JWT Auth -> IP Check -> Session Cleanup -> RBAC/ABAC -> UEBA Scorer. Controllers: File API, Auth API, Admin API, Forensics, MCP Server (SSE/POST).

**Intelligence Layer**: AI Engine (FastAPI, Port 8000) for threat scanning and UEBA. Blockchain (Hardhat, Port 8545) for smart contracts. IPFS (Pinata Cloud) for decentralized storage. MongoDB (Mock DB, Port 27017) for metadata. WebSocket Service for real-time events.

**Integration Flow**:
  Client -> HTTPS/WSS/JWT -> Express Gateway -> [AI Engine, Blockchain, IPFS, MongoDB, WebSocket]
## 4.2 Use Case Diagram

**Actors**: User, Admin, SOC Analyst, AI Agent, Public Recipient

**Use Cases**:

(UC1) Register Account - Create credentials, generate RSA-4096 keys [User]
(UC2) Login with Biometrics - Verify creds, collect biometrics, issue JWT [User]
(UC3) Upload File - AI scan -> encrypt -> IPFS pin -> blockchain register -> capture provenance [User]
(UC4) Download File - Verify access -> blockchain check -> IPFS fetch -> hash verify -> decrypt [User]
(UC5) Share File - Set target + duration + limits + provenance [User]
(UC6) Generate QR Share Link - Token URL + QR code + clipboard copy [User]
(UC7) View Shared Files Inbox - Status badges, expiry, download [User/Recipient]
(UC8) Download via QR Link - Public page, no auth required [Public Recipient]
(UC9) View SOC Dashboard - Real-time threats, activity, compliance [User]
(UC10) Threat Topology Map - Global attack vectors, auto-simulate [User]
(UC11) Run Agent Swarm - 4 agents parallel, MITRE mapping [User]
(UC12) Query Threat Oracle - 72-hour forecast, threat weather [User]
(UC13-15) Analytics, Lifecycle, Copilot [User]
(UC16) Manage Users & Roles - Roles, IP whitelists [Admin]
(UC17-18) Compliance Report, Forensics Timeline [SOC Analyst]
(UC19) AI Agent Analysis - Proactive scanning, incident response [AI Agent]

**Extension Points**:
- UC3: File blocked by AI -> Log threat report, notify via WebSocket
- UC4: Access denied -> Log failed attempt, audit security alert
- UC4: Hash mismatch -> Block download, log integrity violation
- UC6: Share link expired -> Return 403 with expiry info
- UC2: Risk score >= 70 -> Require MFA challenge
- UC2: Session limit exceeded -> Block with audit log
- UC2: IP not whitelisted -> Block with security alert
## 4.3 Data Flow: File Upload Sequence

User -> Frontend -> Gateway -> AI Engine -> Crypto -> IPFS -> Blockchain -> DB
 1. POST /api/files/upload with file + JWT + biometric headers
 2. Zero Trust validation (JWT, IP, session, RBAC)
 3. Forward to AI Engine: POST /api/v1/scan/file (malware, PII, stego, entropy)
 4. AES-256-GCM encrypt file buffer with random key
 5. RSA-4096-OAEP wrap AES key with user public key
 6. SHA-256 hash -> ECDSA sign with user private key
 7. Pin encrypted buffer to IPFS -> receive CID
 8. Register fileHash + CID on blockchain smart contract -> txHash
 9. Save FileDocument with all provenance metadata
 10. Create FileActivity + AuditLog records
 11. Broadcast via WebSocket to connected clients
 12. Return 201 with file metadata

## 4.4 Data Flow: File Download Sequence

User -> Frontend -> Gateway -> IPFS -> Crypto -> Response
 1. GET /api/files/download/:fileId with JWT + biometric headers
 2. Zero Trust validation
 3. Verify ownership OR valid share (time + download limit check)
 4. Verify access on blockchain smart contract
 5. Fetch encrypted buffer from IPFS CID
 6. SHA-256 hash verification against stored fileHash
 7. RSA unwrap AES key with user private key
 8. AES-256-GCM decrypt to plaintext
 9. PDF forensic watermarking (if applicable)
 10. Update file document statistics + viewer tracking
 11. Self-destruct logic if flagged
 12. Log FileActivity + AuditLog
 13. Return decrypted file binary with Content-Disposition header

## 4.5 Data Flow: Share + QR Code Sequence

Owner Share Flow:
 1. POST /api/files/share with fileId, targetUsername, duration, maxDownloads
 2. Validate owner permissions
 3. Find recipient via case-insensitive regex query
 4. Add share entry with expiry, limits, geo provenance
 5. Log FileActivity + AuditLog
 6. WebSocket notify permission change
 7. Return success -> show toast notification

Owner QR Flow:
 1. POST /api/files/generate-share-link with fileId
 2. Generate 32-byte random token
 3. Store token in sharedWith array with isPublicLink=true
 4. Return shareUrl + shareToken -> render QR code via qrcode.react

Recipient QR Flow:
 1. Scan QR -> navigate to /share/:token
 2. GET /api/files/public-share/:token (no auth) -> file metadata
 3. GET /api/files/public-download/:token -> validate expiry/limits -> serve file
## 4.6 Security Controls Matrix

| Control | Implementation | Standard |
|---------|---------------|----------|
| Data Encryption at Rest | AES-256-GCM per-file | GDPR Art 32 |
| Key Management | RSA-4096 OAEP wrapping | ISO 27001 A.10 |
| Identity Verification | JWT + behavioral biometrics | NIST CSF PR.AC-1 |
| Access Control | RBAC + ABAC + Zero Trust | NIST CSF PR.AC-4 |
| Audit Logging | Immutable AuditLog + blockchain | ISO 27001 A.8 |
| Network Security | IP whitelisting + CORS + Helmet | NIST CSF PR.DS-5 |
| Incident Detection | AI threat scanning + UEBA | NIST CSF DE.AE-3 |
| Data Integrity | SHA-256 + blockchain anchoring | ISO 27001 A.12.4 |
| Session Management | Concurrent limits + cleanup | GDPR Art 32 |
| Evidence Preservation | Forensic watermarking + custody | NIST CSF PR.IP-7 |

## 4.7 Compliance Mapping

| Regulation | Control | Aegis Implementation |
|-----------|---------|---------------------|
| GDPR Art 32 | Encryption | AES-256-GCM + RSA-4096 |
| GDPR Art 33 | Breach notification | WebSocket threat alerts |
| ISO 27001 A.8 | Audit trail | AuditLog + blockchain |
| ISO 27001 A.10 | Crypto controls | Hybrid encryption + signatures |
| NIST CSF PR.AC | Access control | Zero Trust + UEBA |
| NIST CSF DE.AE | Anomaly detection | AI + behavioral biometrics |
| NIST CSF PR.DS | Data security | IPFS + self-destruct |
| NIST CSF PR.IP | Protective tech | Blockchain + watermarking |

## 4.8 Deployment Architecture

Docker Compose deployment:
- Nginx Frontend: Port 3000
- Express Backend: Port 5000
- FastAPI AI Engine: Port 8000
- MongoDB: Port 27017
- Hardhat EVM: Port 8545
- IPFS: Pinata Cloud (or local mock)

## 4.9 MCP Tools Reference

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| get_security_alerts | Threat detections | limit | Threat reports |
| get_audit_logs | Access trails | limit | Audit events |
| query_blockchain_metadata | On-chain records | limit | Hashes, CIDs |
| get_file_provenance | File lifecycle trace | fileId | Activity timeline |
| get_file_analytics | File statistics | fileId | Downloads, shares, geo |
| get_global_activity | System analytics | limit | Activity breakdown |
| run_agent_swarm | Execute AI agents | agentName | Findings, recommendations |
| get_threat_forecast | 72-hr predictions | none | Forecast, weather |
| get_global_threat_map | Attack topology | limit | Source/target geo |

## 4.10 File Structure

frontend/src/: DashboardLayout.tsx, AuthContext.tsx, App.tsx, 15 page components
backend/src/: config/db.ts, 8 controllers, 2 middleware, 8 models, 3 routes, 7 services, cryptoHelper.ts, mcpServer.ts, server.ts
ai_engine/: app/main.py (FastAPI)
blockchain/contracts/: FileRegistry.sol, DecentralizedID.sol

---

*Document generated for Aegis Cyber Shield v2.0*
*32+ source files | ~12,000+ lines (TypeScript, Python, Solidity)*
*GitHub: https://github.com/ERYADUKRISHNANNK/Aegis-Cyber-*
