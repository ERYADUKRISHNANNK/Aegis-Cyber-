# Aegis Cyber — API Documentation

**Base URL:** `http://localhost:5000`  
**API Prefix:** `/api`  
**Auth:** JWT Bearer token required on all protected endpoints  
**Content-Type:** `application/json` (except file upload: `multipart/form-data`)

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST `/api/auth/register`

Register a new user and generate RSA key pair.

**Request:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "StrongPass@2026!",
  "role": "User"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "userId": "64a1b2c3d4e5f6789...",
  "rsaPublicKey": "-----BEGIN PUBLIC KEY-----\n..."
}
```

**Errors:** `400` username/email exists, `500` server error

---

### POST `/api/auth/login`

Authenticate and receive JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "Aegis@Admin2026!"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64a1...",
    "username": "admin",
    "email": "admin@aegis.cyber",
    "role": "Super Admin",
    "didAddress": "0xabc...",
    "rsaPublicKey": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

**Errors:** `401` invalid credentials, `403` account locked

---

### POST `/api/auth/refresh`

Refresh expired access token.

**Request:**
```json
{ "token": "<expired_or_valid_jwt>" }
```

**Response 200:**
```json
{ "token": "<new_jwt>" }
```

---

### POST `/api/auth/logout`
**Auth Required**

**Request:** (empty body or token in header)

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### POST `/api/auth/wallet`
**Auth Required**

Link an EVM wallet address and register a Decentralized Identifier.

**Request:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "didUri": "did:ethr:0x1234..."
}
```

**Response 200:**
```json
{
  "message": "Wallet linked and DID registered on-chain",
  "txHash": "0xabc..."
}
```

---

### POST `/api/auth/issue-vc`
**Auth Required | Roles: Super Admin, Admin**

Issue a W3C-style Verifiable Credential.

**Request:**
```json
{
  "subjectDid": "did:ethr:0x...",
  "credentialType": "SecurityClearance",
  "claims": { "clearanceLevel": "Top Secret", "validUntil": "2027-01-01" }
}
```

**Response 200:**
```json
{
  "verifiableCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "SecurityClearance"],
    "issuer": "did:ethr:0xissuer...",
    "credentialSubject": { "id": "did:ethr:0x...", "clearanceLevel": "Top Secret" },
    "proof": { "type": "EcdsaSecp256k1Signature2019", "jws": "..." }
  }
}
```

---

## File Endpoints

### GET `/api/files/list`
**Auth Required**

List files owned by the authenticated user.

**Response 200:**
```json
[
  {
    "_id": "64a1...",
    "fileName": "document.pdf",
    "fileSize": 204800,
    "cid": "QmXxx...",
    "fileHash": "sha256:abc...",
    "threatScore": 2,
    "blockchainTxHash": "0xabc...",
    "createdAt": "2026-10-22T10:00:00Z",
    "sharedWith": []
  }
]
```

---

### POST `/api/files/upload`
**Auth Required | Content-Type: multipart/form-data | Max: 50MB**

Upload, scan, encrypt, and store a file.

**Request:** `multipart/form-data` with field `file`

**Response 201:**
```json
{
  "message": "File uploaded and secured successfully",
  "file": {
    "_id": "64a1...",
    "fileName": "report.pdf",
    "fileSize": 102400,
    "cid": "QmYyy...",
    "blockchainTxHash": "0xdef...",
    "threatScore": 0,
    "threatDetails": {
      "verdict": "CLEAN",
      "flags": [],
      "mitreAttack": []
    }
  }
}
```

**Errors:**
- `400` no file provided
- `403` Zero Trust policy block
- `422` threat detected — file blocked:
  ```json
  { "error": "File blocked: threat detected", "threatScore": 85, "flags": ["HIGH_ENTROPY_RANSOMWARE"] }
  ```

---

### GET `/api/files/download/:fileId`
**Auth Required**

Download and decrypt a file.

**Response:** Binary file stream with headers:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"
```

**Errors:** `403` not owner/not shared, `404` file not found, `422` integrity check failed

---

### POST `/api/files/share`
**Auth Required**

Share a file with another user with access controls.

**Request:**
```json
{
  "fileId": "64a1...",
  "recipientUsername": "bob",
  "validUntil": "2026-12-31T23:59:59Z",
  "maxDownloads": 5
}
```

**Response 200:**
```json
{
  "message": "File shared successfully",
  "shareDetails": {
    "recipient": "bob",
    "validUntil": "2026-12-31T23:59:59Z",
    "maxDownloads": 5,
    "blockchainTxHash": "0xghi..."
  }
}
```

---

### POST `/api/files/generate-share-link`
**Auth Required**

Generate a public share link (with QR code data).

**Request:**
```json
{
  "fileId": "64a1...",
  "validUntil": "2026-11-30T23:59:59Z",
  "maxDownloads": 3
}
```

**Response 200:**
```json
{
  "shareToken": "abc123xyz...",
  "shareUrl": "http://localhost:3000/public-share/abc123xyz...",
  "validUntil": "2026-11-30T23:59:59Z"
}
```

---

### GET `/api/files/public-share/:shareToken`

Get public share metadata (no auth required).

**Response 200:**
```json
{
  "fileName": "report.pdf",
  "fileSize": 102400,
  "owner": "alice",
  "validUntil": "2026-11-30T23:59:59Z",
  "downloadsRemaining": 2
}
```

---

### GET `/api/files/public-download/:shareToken`

Download via public share link (no auth required, subject to download limit).

**Response:** Binary file stream.

**Errors:** `410` link expired, `429` download limit exceeded

---

## Forensics & SOC Endpoints

### GET `/api/forensics/timeline`
**Auth Required | Roles: Super Admin, Admin, Security Analyst, SOC Analyst**

Retrieve security event timeline.

**Response 200:**
```json
{
  "events": [
    {
      "timestamp": "2026-10-22T10:30:00Z",
      "action": "SECURITY_ALERT",
      "username": "unknown_user",
      "ip": "203.0.113.42",
      "details": "Access attempt from unauthorized IP address.",
      "status": "BLOCKED"
    }
  ],
  "total": 150
}
```

---

### GET `/api/compliance/report`
**Auth Required | Roles: Super Admin, Admin, Auditor, Compliance Officer**

GDPR / ISO 27001 / NIST CSF compliance scorecard.

**Response 200:**
```json
{
  "gdpr": { "score": 87, "controls": { "Art32_Encryption": true, "Art33_BreachNotification": true } },
  "iso27001": { "score": 82, "controls": { "A8_AssetManagement": true, "A9_AccessControl": true } },
  "nistCsf": { "score": 79, "functions": { "PR_AC": 90, "DE_CM": 75, "RS_RP": 70 } }
}
```

---

### POST `/api/copilot/query`
**Auth Required**

Query the AI Security Copilot.

**Request:**
```json
{ "query": "How do I respond to a ransomware incident?" }
```

**Response 200:**
```json
{
  "response": "Immediate ransomware response steps: 1. Isolate affected systems...",
  "sources": ["NIST SP 800-61r2", "MITRE ATT&CK T1486"],
  "mitreAttack": ["T1486 - Data Encrypted for Impact"]
}
```

---

## Admin Endpoints

### GET `/api/admin/system-health`
**Auth Required | Roles: Super Admin, Admin**

**Response 200:**
```json
{
  "status": "healthy",
  "database": "mock",
  "totalUsers": 12,
  "activeThreats": 3,
  "totalFiles": 47,
  "totalAuditLogs": 1250,
  "aiEngine": "online",
  "blockchain": "online",
  "timestamp": "2026-10-22T16:00:00Z"
}
```

---

### GET `/api/admin/users`
**Auth Required | Roles: Super Admin, Admin**

**Response 200:**
```json
[
  {
    "_id": "64a1...",
    "username": "alice",
    "email": "alice@example.com",
    "role": "User",
    "active": true,
    "createdAt": "2026-10-01T08:00:00Z"
  }
]
```

---

### POST `/api/admin/update-role`
**Auth Required | Roles: Super Admin**

**Request:**
```json
{ "userId": "64a1...", "newRole": "SOC Analyst" }
```

**Response 200:**
```json
{ "message": "Role updated successfully", "username": "alice", "newRole": "SOC Analyst" }
```

---

### POST `/api/admin/update-ip`
**Auth Required | Roles: Super Admin, Admin**

**Request:**
```json
{ "userId": "64a1...", "whitelistedIps": ["192.168.1.100", "10.0.0.5"] }
```

**Response 200:**
```json
{ "message": "IP whitelist updated" }
```

---

## Analytics Endpoints

### GET `/api/analytics/file-stats`
**Auth Required**

Returns file upload volume, download counts, threat detection rates over time.

### GET `/api/analytics/event-breakdown`
**Auth Required**

Returns event type distribution (UPLOAD, DOWNLOAD, SHARE, BLOCK, etc.).

### GET `/api/analytics/top-users`
**Auth Required | Roles: Admin+**

Returns most active users by file operations.

---

## Threat Endpoints

### GET `/api/threats/topology`
**Auth Required**

Network threat topology graph data.

### GET `/api/threats/oracle`
**Auth Required**

Live threat intelligence feed.

### POST `/api/threats/simulate`
**Auth Required | Roles: SOC Analyst, Admin+**

Trigger a simulated threat event for testing.

---

## AI Engine Endpoints (Port 8000)

### POST `/api/v1/scan/file`

Scan a file for threats.

**Request:** `multipart/form-data` with field `file`

**Response 200:**
```json
{
  "verdict": "CLEAN",
  "threat_score": 5,
  "flags": [],
  "entropy": 4.2,
  "pii_detected": false,
  "steganography": false,
  "mitre_attack": []
}
```

---

### POST `/api/v1/ueba/evaluate`

Evaluate user behavioral risk.

**Request:**
```json
{
  "username": "alice",
  "ip": "192.168.1.10",
  "location": { "lat": 12.97, "lon": 77.59, "country": "IN" },
  "device_trust_metrics": {
    "is_known_device": true,
    "is_known_ip": true
  },
  "biometrics": {
    "keystroke_average_hold_ms": 95.0,
    "mouse_jitter_index": 1.2
  },
  "session_concurrent": 1,
  "timestamp": 1729612800
}
```

**Response 200:**
```json
{
  "risk_score": 12,
  "action": "ALLOW",
  "reasons": [],
  "ueba_flags": []
}
```

---

## WebSocket Events (Port 5000)

Connect: `ws://localhost:5000`

**Event Format:**
```json
{
  "type": "THREAT_ALERT | FILE_UPLOADED | SECURITY_ALERT | SESSION_EVENT",
  "payload": { ... },
  "timestamp": "2026-10-22T16:00:00Z"
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthenticated — invalid or missing JWT |
| 403 | Forbidden — Zero Trust policy block (IP, role, session, UEBA) |
| 404 | Resource not found |
| 410 | Gone — share link expired |
| 422 | Unprocessable — threat detected / integrity failure |
| 429 | Too many requests / download limit exceeded |
| 500 | Internal server error |

## Zero Trust 403 Response

```json
{
  "error": "Zero Trust: Role verification failed.",
  "reasons": ["Required roles: Admin, Super Admin. Current: User"],
  "requireMfa": false
}
```
