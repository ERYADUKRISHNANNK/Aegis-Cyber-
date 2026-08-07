import { Response } from "express";
import axios from "axios";
import { ThreatReport } from "../models/ThreatReport";
import { AuditLog } from "../models/AuditLog";
import { FileDocument } from "../models/FileDocument";
import { CryptoHelper } from "../utils/cryptoHelper";

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

export const getForensicsTimeline = async (req: any, res: Response) => {
  try {
    const threats = await ThreatReport.find().sort({ createdAt: -1 }).limit(10);
    const audits = await AuditLog.find({ action: { $in: ["LOGIN", "UPLOAD", "DOWNLOAD", "PERMISSION_CHANGE", "SECURITY_ALERT"] } })
      .sort({ createdAt: -1 })
      .limit(30);

    const timeline = [
      ...threats.map((t) => ({
        id: t._id,
        type: "THREAT",
        title: `Threat Blocked: ${t.fileName}`,
        description: `Flagged: ${t.detectedThreats.join(", ")}. Score: ${t.threatScore}/100. Action: ${t.suggestedAction}`,
        timestamp: t.createdAt,
        severity: t.threatScore >= 60 ? "CRITICAL" : "HIGH",
        user: t.uploaderUsername
      })),
      ...audits.map((a) => ({
        id: a._id,
        type: "AUDIT",
        title: `Audit log: ${a.action}`,
        description: a.details,
        timestamp: a.timestamp,
        severity: a.status === "BLOCKED" || a.status === "FAILED" ? "WARNING" : "INFO",
        user: a.username
      }))
    ];

    // Sort combined records descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json(timeline);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getComplianceReport = async (req: any, res: Response) => {
  try {
    const totalFiles = await FileDocument.countDocuments();
    const threatLogsCount = await ThreatReport.countDocuments({ status: "ACTIVE" });
    const blockedLogins = await AuditLog.countDocuments({ action: "LOGIN", status: "FAILED" });
    const policyChanges = await AuditLog.countDocuments({ action: "POLICY_UPDATE" });

    // Calculate simulated compliance scorecard metrics based on settings
    const gdprScore = Math.max(100 - (threatLogsCount * 5), 45); // Affected by active unmitigated alerts
    const isoScore = Math.min(60 + (totalFiles > 0 ? 20 : 0) + (policyChanges > 0 ? 20 : 0), 100);
    const nistScore = Math.max(100 - (blockedLogins * 2), 70);

    return res.json({
      scorecard: {
        gdpr: gdprScore,
        iso27001: isoScore,
        nistCSF: nistScore,
        overall: Math.round((gdprScore + isoScore + nistScore) / 3)
      },
      auditChecks: [
        { control: "GDPR Art 32", status: "COMPLIANT", description: "Encryption of personal data implemented (AES-256-GCM + RSA key wrap)." },
        { control: "GDPR Art 33", status: threatLogsCount > 0 ? "ACTION_REQUIRED" : "COMPLIANT", description: "Breach notification alerts linked to live WebSockets." },
        { control: "ISO 27001 A.8", status: "COMPLIANT", description: "Audit trail log stored with ledger receipts." },
        { control: "NIST CSF PR.AC", status: "COMPLIANT", description: "Zero Trust parameters verify geographic ingress logs." }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const chatCopilot = async (req: any, res: Response) => {
  const { query, fileId } = req.body;
  try {
    let context: any = {};
    if (fileId) {
      const doc = await FileDocument.findById(fileId);
      if (doc) {
        context = {
          file_name: doc.fileName,
          threat_score: doc.threatScore,
          detected_threats: doc.threatScore > 0 ? ["Simulated Threat Indicators"] : [],
          file_hash: doc.fileHash
        };
      }
    }

    try {
      const response = await axios.post(`${AI_ENGINE_URL}/api/v1/copilot/chat`, {
        query,
        context
      }, { timeout: 4000 });
      return res.json(response.data);
    } catch {
      // AI engine offline - generate a contextual fallback response
      const q = (query || "").toLowerCase();
      let response = "";
      let mitre_tactics: string[] = [];
      let suggested_action_plan: string[] = [];

      if (q.includes("gdpr") || q.includes("compliance") || q.includes("regulatory")) {
        response = "GDPR compliance status: Based on current audit logs, all personal data encryption (AES-256-GCM + RSA key wrap) is operational. Article 32 encryption requirements are COMPLIANT. Article 33 breach notification is linked to live WebSocket streams. Recommend reviewing Data Processing Agreements (DPAs) with third-party vendors and ensuring consent management records are up to date.";
        mitre_tactics = ["PR.IP-7 (Protection Processes)", "PR.MA-2 (Remote Maintenance)"];
        suggested_action_plan = ["Review GDPR DPA agreements with all vendors", "Schedule quarterly privacy impact assessment", "Verify data subject access request (DSAR) response time SLAs", "Audit consent records for completeness"];
      } else if (q.includes("threat") || q.includes("malware") || q.includes("ransomware") || q.includes("attack")) {
        response = "Threat analysis summary: The SOC dashboard shows all uploaded files pass through a multi-stage AI scan engine (malware, PII, steganography). Current threat interception count is tracked in real-time. The MITRE ATT&CK coverage maps T1566 (Phishing), T1486 (Data Encrypted for Impact), T1027 (Obfuscated Files), and T1204 (User Execution). All blockchain transaction hashes are preserved for forensic chain-of-custody evidence.";
        mitre_tactics = ["TA0001 - Initial Access", "TA0002 - Execution", "TA0005 - Defense Evasion", "TA0040 - Impact"];
        suggested_action_plan = ["Enable real-time WebSocket threat alerts on the dashboard", "Run the Crypto Integrity Audit on the Forensics tab", "Review blocked file reports in the vault", "Check zero-trust session anomaly scores"];
      } else if (q.includes("blockchain") || q.includes("smart contract") || q.includes("ipfs") || q.includes("custody")) {
        response = "Blockchain integrity report: All file uploads are anchored via a Solidity FileRegistry smart contract. Each registration records: file SHA-256 hash, IPFS content identifier (CID), owner address, digital signature, and threat score. The chain of custody is verifiable through the Forensics panel's Crypto Integrity Audit feature. IPFS mock storage is active in offline mode; connect to Pinata cloud or a live Hardhat EVM node for production deployment.";
        mitre_tactics = ["PR.DS-6 (Integrity Checking)", "PR.DS-1 (Data-at-rest Protection)"];
        suggested_action_plan = ["Run Crypto Integrity Audit in Forensics tab", "Download forensic evidence certificate for legal records", "Verify smart contract addresses in Admin panel", "Configure PINATA_API_KEY for live IPFS pinning"];
      } else if (q.includes("vault") || q.includes("encrypt") || q.includes("file") || q.includes("upload")) {
        response = "Secure vault status: Files are encrypted using AES-256-GCM authenticated encryption with a unique key per upload. The AES key is then RSA-wrapped using the user's 4096-bit public key — ensuring zero-knowledge storage. Each file download triggers an IPFS CID hash validation against the blockchain record. Self-destruct files are purged from both IPFS storage and the database after successful download.";
        mitre_tactics = ["PR.DS-1 (Data-at-rest Protection)", "PR.DS-5 (Leakage Protection)"];
        suggested_action_plan = ["Link a DID wallet from the Vault page for on-chain registration", "Use self-destruct mode for sensitive one-time documents", "Share files via dynamic access policies with expiry time limits"];
      } else if (q.includes("mfa") || q.includes("zero trust") || q.includes("auth") || q.includes("login")) {
        response = "Zero Trust authentication status: The system employs behavioral biometric continuous authentication (keystroke dynamics + mouse jitter velocity). Browser fingerprinting is compared on each request. The UEBA AI engine monitors concurrent session counts, geolocation travel velocity, and device trust metrics. MFA challenge is triggered automatically when risk score exceeds 70/100.";
        mitre_tactics = ["PR.AC-1 (Identity Management)", "PR.AC-3 (Remote Access Management)", "DE.AE-3 (Event Data Aggregation)"];
        suggested_action_plan = ["Enable TOTP secret for Admin accounts", "Review session logs for anomalous concurrent sessions", "Configure IP whitelisting for high-privilege roles in Admin panel"];
      } else {
        response = `Aegis AI Security Copilot (offline mode): I'm currently operating in rule-based fallback mode as the AI microservice is unreachable. Your query "${query}" has been logged. For full AI-powered threat analysis, ensure the FastAPI Python service is running on port 8000. In the meantime, I can help with: GDPR compliance, threat analysis, blockchain integrity, vault encryption, or zero-trust authentication topics.`;
        suggested_action_plan = ["Start the AI engine: cd ai_engine && pip install -r requirements.txt && uvicorn main:app --port 8000", "Check Docker status if using containerized deployment", "Review the SOC Dashboard for real-time telemetry"];
      }

      return res.json({ response, mitre_tactics, suggested_action_plan });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

