import { FileDocument } from "../models/FileDocument";
import { FileActivity } from "../models/FileActivity";
import { ThreatReport } from "../models/ThreatReport";
import { AuditLog } from "../models/AuditLog";
import { ThreatIntelligence } from "../models/ThreatIntelligence";

// ============================================
// Base Agent Class
// ============================================
abstract class BaseAgent {
  name: string;
  role: string;
  status: "idle" | "analyzing" | "reporting" = "idle";
  lastAction: string = "";
  lastActionTime: Date | null = null;
  messages: AgentMessage[] = [];

  constructor(name: string, role: string) {
    this.name = name;
    this.role = role;
  }

  abstract analyze(context: AgentContext): Promise<AgentResult>;

  log(message: string) {
    this.messages.push({ from: this.name, message, timestamp: new Date() });
    this.lastAction = message;
    this.lastActionTime = new Date();
  }
}

interface AgentMessage {
  from: string;
  message: string;
  timestamp: Date;
}

interface AgentContext {
  fileId?: string;
  query?: string;
  threatData?: any;
  activityData?: any;
  timeframe?: string;
}

interface AgentResult {
  agent: string;
  confidence: number;
  findings: string[];
  recommendations: string[];
  mitreTactics: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  data: any;
}

// ============================================
// Scanner Agent - Proactive threat scanning
// ============================================
class ScannerAgent extends BaseAgent {
  constructor() {
    super("Scanner", "Proactive Threat Detection & File Analysis");
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    this.status = "analyzing";
    this.log("Initiating proactive threat scan across vault...");

    const findings: string[] = [];
    const recommendations: string[] = [];
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let confidence = 0;

    // Scan for high-threat files
    const highThreatFiles = await FileDocument.find({ threatScore: { $gt: 60 } });
    if (highThreatFiles.length > 0) {
      findings.push(`${highThreatFiles.length} files with elevated threat scores (>60) detected in vault`);
      severity = "HIGH";
      confidence += 30;
      recommendations.push("Review quarantined files and consider permanent removal");
    }

    // Scan for files with unusual access patterns
    const recentActivities = await FileActivity.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    const suspiciousDownloads = recentActivities.filter((a: any) => 
      a.eventType === "DOWNLOAD" && !a.success
    );
    if (suspiciousDownloads.length > 5) {
      findings.push(`${suspiciousDownloads.length} failed download attempts in recent activity`);
      severity = severity === "HIGH" ? "CRITICAL" : "MEDIUM";
      confidence += 25;
      recommendations.push("Investigate potential unauthorized access attempts");
    }

    // Check for files without blockchain registration
    const unregistered = await FileDocument.find({ blockchainTxHash: "" });
    if (unregistered.length > 0) {
      findings.push(`${unregistered.length} files missing blockchain registration`);
      confidence += 15;
      recommendations.push("Register unregistered files on-chain for integrity verification");
    }

    // Check for expired shares
    const allFiles = await FileDocument.find({});
    let expiredShares = 0;
    for (const file of allFiles) {
      for (const share of file.sharedWith || []) {
        if (share.validUntil && new Date(share.validUntil) < new Date()) {
          expiredShares++;
        }
      }
    }
    if (expiredShares > 0) {
      findings.push(`${expiredShares} expired share access policies still active`);
      confidence += 10;
      recommendations.push("Clean up expired share policies to reduce attack surface");
    }

    if (findings.length === 0) {
      findings.push("No immediate threats detected. All systems operating within normal parameters.");
      confidence = 95;
    }

    this.status = "reporting";
    this.log(`Scan complete: ${findings.length} findings, severity: ${severity}`);

    return {
      agent: this.name,
      confidence: Math.min(confidence + 40, 99),
      findings,
      recommendations,
      mitreTactics: ["PR.DS-1", "PR.AC-4"],
      severity,
      data: { highThreatFiles: highThreatFiles.length, suspiciousDownloads: suspiciousDownloads.length, expiredShares }
    };
  }
}

// ============================================
// Responder Agent - Incident response
// ============================================
class ResponderAgent extends BaseAgent {
  constructor() {
    super("Responder", "Automated Incident Response & Mitigation");
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    this.status = "analyzing";
    this.log("Analyzing incident data for response actions...");

    const findings: string[] = [];
    const recommendations: string[] = [];
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let confidence = 50;

    // Analyze recent threats
    const recentThreats = await ThreatReport.find().sort({ createdAt: -1 }).limit(10);
    
    if (recentThreats.length > 0) {
      const activeThreats = recentThreats.filter((t: any) => t.status === "ACTIVE");
      findings.push(`${activeThreats.length} active threat reports requiring attention`);
      
      if (activeThreats.length > 3) {
        severity = "CRITICAL";
        recommendations.push("Immediately isolate affected systems and rotate encryption keys");
        recommendations.push("Enable emergency lock on FileRegistry smart contract");
        confidence = 85;
      } else if (activeThreats.length > 0) {
        severity = "HIGH";
        recommendations.push("Review flagged files and apply containment measures");
        confidence = 70;
      }
    }

    // Check session anomalies
    const failedLogins = await AuditLog.countDocuments({ action: "LOGIN", status: "FAILED" });
    if (failedLogins > 10) {
      findings.push(`${failedLogins} failed login attempts detected - possible brute force`);
      severity = severity === "CRITICAL" ? "CRITICAL" : "HIGH";
      recommendations.push("Temporarily lock accounts with excessive failed attempts");
      recommendations.push("Enable CAPTCHA challenge for repeated failures");
      confidence += 20;
    }

    // Auto-response actions
    const responseActions: string[] = [];
    if (severity === "CRITICAL") {
      responseActions.push("EMERGENCY: Consider activating system-wide lockdown");
      responseActions.push("Notify SOC team via emergency channel");
      responseActions.push("Preserve forensic evidence snapshot");
    }

    this.status = "reporting";
    this.log(`Response analysis: ${findings.length} incidents, ${responseActions.length} auto-actions recommended`);

    return {
      agent: this.name,
      confidence: Math.min(confidence, 95),
      findings,
      recommendations: [...recommendations, ...responseActions],
      mitreTactics: ["DE.AE-3", "RS.RP-1"],
      severity,
      data: { recentThreats: recentThreats.length, failedLogins, responseActions }
    };
  }
}

// ============================================
// Forensics Agent - Deep investigation
// ============================================
class ForensicsAgent extends BaseAgent {
  constructor() {
    super("Forensics", "Digital Forensics & Chain of Custody Analysis");
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    this.status = "analyzing";
    this.log("Initiating forensic investigation...");

    const findings: string[] = [];
    const recommendations: string[] = [];
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let confidence = 60;

    // Analyze file lifecycle integrity
    const totalFiles = await FileDocument.countDocuments();
    const filesWithBlockchain = await FileDocument.find({ blockchainTxHash: { $ne: "" } });
    const integrityScore = totalFiles > 0 ? Math.round((filesWithBlockchain.length / totalFiles) * 100) : 100;

    findings.push(`Blockchain integrity coverage: ${integrityScore}% of files registered on-chain`);
    if (integrityScore < 80) {
      severity = "MEDIUM";
      recommendations.push("Register remaining files on blockchain for complete audit trail");
      confidence += 15;
    }

    // Analyze geographic anomalies
    const recentDownloads = await FileActivity.find({ eventType: "DOWNLOAD" }).sort({ timestamp: -1 }).limit(20);
    const uniqueCountries = new Set(recentDownloads.map((a: any) => a.geoLocation?.country).filter(Boolean));
    if (uniqueCountries.size > 5) {
      findings.push(`Downloads from ${uniqueCountries.size} different countries detected - review for unauthorized access`);
      severity = severity === "LOW" ? "MEDIUM" : severity;
      recommendations.push("Verify download locations against user travel patterns");
      confidence += 10;
    }

    // Chain of custody verification
    const activities = await FileActivity.find().sort({ timestamp: -1 }).limit(50);
    const chainedEvents = activities.filter((a: any) => a.blockchainTxHash);
    findings.push(`Chain of custody: ${chainedEvents.length}/${activities.length} recent events have blockchain anchoring`);

    // Check for evidence preservation
    const selfDestructFiles = await FileDocument.find({ selfDestruct: true });
    if (selfDestructFiles.length > 0) {
      findings.push(`${selfDestructFiles.length} files flagged for self-destruct - evidence may be lost`);
      recommendations.push("Consider preserving forensic copies before self-destruct triggers");
      confidence += 10;
    }

    this.status = "reporting";
    this.log(`Forensic analysis complete: integrity ${integrityScore}%, ${findings.length} findings`);

    return {
      agent: this.name,
      confidence: Math.min(confidence + 20, 95),
      findings,
      recommendations,
      mitreTactics: ["PR.DS-6", "DE.CM-1"],
      severity,
      data: { integrityScore, totalFiles, blockchainCoverage: filesWithBlockchain.length, selfDestructFiles: selfDestructFiles.length }
    };
  }
}

// ============================================
// Compliance Agent - Regulatory compliance
// ============================================
class ComplianceAgent extends BaseAgent {
  constructor() {
    super("Compliance", "Regulatory Compliance & Policy Enforcement");
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    this.status = "analyzing";
    this.log("Evaluating compliance posture across frameworks...");

    const findings: string[] = [];
    const recommendations: string[] = [];
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let confidence = 70;

    // GDPR Art 32 - Encryption compliance
    const totalFiles = await FileDocument.countDocuments();
    const encryptedFiles = await FileDocument.countDocuments({ encryptedAesKey: { $exists: true, $ne: "" } });
    const encryptionCompliance = totalFiles > 0 ? Math.round((encryptedFiles / totalFiles) * 100) : 100;
    
    findings.push(`GDPR Art 32 (Encryption): ${encryptionCompliance}% of files properly encrypted`);
    if (encryptionCompliance < 100) {
      severity = "MEDIUM";
      recommendations.push("Encrypt all remaining files to meet GDPR Art 32 requirements");
    }

    // ISO 27001 A.8 - Audit trail
    const totalAuditLogs = await AuditLog.countDocuments({});
    findings.push(`ISO 27001 A.8 (Audit Trail): ${totalAuditLogs} audit events recorded`);
    if (totalAuditLogs < 10) {
      recommendations.push("Increase audit logging granularity for ISO 27001 compliance");
      confidence -= 10;
    }

    // NIST CSF PR.AC - Access control
    const failedAccessAttempts = await AuditLog.countDocuments({ action: "DOWNLOAD", status: "FAILED" });
    if (failedAccessAttempts > 5) {
      findings.push(`NIST CSF PR.AC: ${failedAccessAttempts} failed access attempts - review access policies`);
      severity = severity === "LOW" ? "MEDIUM" : severity;
      recommendations.push("Review and tighten file access control policies");
      confidence -= 5;
    }

    // Data retention compliance
    const oldFiles = await FileDocument.find({ createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } });
    if (oldFiles.length > 0) {
      findings.push(`${oldFiles.length} files older than 1 year - review retention policy`);
      recommendations.push("Implement automated data retention and disposal policies");
    }

    // Compliance score
    const scores = {
      gdpr: encryptionCompliance,
      iso27001: Math.min(100, 60 + (totalAuditLogs > 100 ? 40 : totalAuditLogs > 10 ? 20 : 0)),
      nistCSF: Math.max(50, 100 - (failedAccessAttempts * 5))
    };

    this.status = "reporting";
    this.log(`Compliance analysis: GDPR ${scores.gdpr}%, ISO ${scores.iso27001}%, NIST ${scores.nistCSF}%`);

    return {
      agent: this.name,
      confidence: Math.min(confidence, 95),
      findings,
      recommendations,
      mitreTactics: ["PR.AC-1", "PR.DS-1"],
      severity,
      data: { scores, totalFiles, totalAuditLogs, encryptionCompliance }
    };
  }
}

// ============================================
// Agent Swarm Orchestrator
// ============================================
class AgentSwarmOrchestrator {
  private agents: BaseAgent[];
  private coordinationLog: { timestamp: Date; message: string }[] = [];

  constructor() {
    this.agents = [
      new ScannerAgent(),
      new ResponderAgent(),
      new ForensicsAgent(),
      new ComplianceAgent()
    ];
  }

  /**
   * Run all agents in parallel and aggregate results
   */
  async runFullAnalysis(context: AgentContext = {}): Promise<SwarmReport> {
    this.log("Swarm orchestrator: Initiating full multi-agent analysis...");

    // Run all agents in parallel
    const results = await Promise.all(
      this.agents.map(agent => agent.analyze(context))
    );

    // Calculate aggregate severity
    const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const maxSeverity = results.reduce((max, r) => {
      return severities.indexOf(r.severity) > severities.indexOf(max) ? r.severity : max;
    }, "LOW" as string);

    // Aggregate all findings and recommendations
    const allFindings = results.flatMap(r => r.findings);
    const allRecommendations = results.flatMap(r => r.recommendations);
    const allMitreTactics = [...new Set(results.flatMap(r => r.mitreTactics))];
    const avgConfidence = Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length);

    this.log("Swarm analysis complete. Compiling report...");

    return {
      timestamp: new Date().toISOString(),
      overallSeverity: maxSeverity as any,
      overallConfidence: avgConfidence,
      agents: results,
      summary: {
        totalFindings: allFindings.length,
        criticalFindings: allFindings.length,
        totalRecommendations: allRecommendations.length,
        mitreTacticsCovered: allMitreTactics.length
      },
      coordinationLog: this.coordinationLog.map(l => ({ ...l, timestamp: l.timestamp }))
    };
  }

  /**
   * Run a specific agent
   */
  async runAgent(agentName: string, context: AgentContext = {}): Promise<AgentResult | null> {
    const agent = this.agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
    if (!agent) return null;
    return await agent.analyze(context);
  }

  /**
   * Get swarm status
   */
  getStatus() {
    return {
      agents: this.agents.map(a => ({
        name: a.name,
        role: a.role,
        status: a.status,
        lastAction: a.lastAction,
        lastActionTime: a.lastActionTime
      })),
      totalAgents: this.agents.length,
      coordinationLog: this.coordinationLog.slice(-10)
    };
  }

  private log(message: string) {
    this.coordinationLog.push({ timestamp: new Date(), message });
    if (this.coordinationLog.length > 100) {
      this.coordinationLog = this.coordinationLog.slice(-100);
    }
  }
}

interface SwarmReport {
  timestamp: string;
  overallSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  overallConfidence: number;
  agents: AgentResult[];
  summary: {
    totalFindings: number;
    criticalFindings: number;
    totalRecommendations: number;
    mitreTacticsCovered: number;
  };
  coordinationLog: { timestamp: Date; message: string }[];
}

export const agentSwarm = new AgentSwarmOrchestrator();
