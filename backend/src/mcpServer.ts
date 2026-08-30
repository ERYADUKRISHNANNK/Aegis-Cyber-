import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { ThreatReport } from "./models/ThreatReport";
import { AuditLog } from "./models/AuditLog";
import { FileDocument } from "./models/FileDocument";
import { FileActivity } from "./models/FileActivity";
import { ThreatIntelligence } from "./models/ThreatIntelligence";
import { agentSwarm } from "./services/agentSwarmService";
import { generateForecast } from "./services/threatOracleService";

// 1. Initialize MCP Server instance
export const mcpServer = new Server(
  {
    name: "aegis-cyber-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// 2. Register resources (Exposes server state metadata)
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "aegis://system/health",
        mimeType: "application/json",
        name: "Aegis SOC Operational Health",
        description: "Live cybersecurity indices, active threat vectors counts, and system compliance scores."
      },
      {
        uri: "aegis://system/file-activity-feed",
        mimeType: "application/json",
        name: "Real-time File Activity Feed",
        description: "Live stream of file lifecycle events: uploads, downloads, shares, and access checks across the vault."
      }
    ]
  };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "aegis://system/health") {
    try {
      const activeThreats = await ThreatReport.countDocuments({ status: "ACTIVE" });
      const totalAlerts = await ThreatReport.countDocuments();
      const auditLogCount = await AuditLog.countDocuments();
      
      const metrics = {
        status: "OPERATIONAL",
        threatIndex: 14 + activeThreats,
        totalAuditTrails: auditLogCount,
        interceptedThreats: totalAlerts,
        activeQuarantinedAlerts: activeThreats,
        timestamp: new Date().toISOString()
      };

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(metrics, null, 2)
          }
        ]
      };
    } catch (err: any) {
      throw new Error(`Failed to query database metrics: ${err.message}`);
    }
  }

  if (request.params.uri === "aegis://system/file-activity-feed") {
    try {
      const recentActivities = await FileActivity.find()
        .sort({ timestamp: -1 })
        .limit(20);

      const feed = recentActivities.map((a: any) => ({
        eventType: a.eventType,
        fileName: a.fileName,
        performedBy: a.performedByUsername,
        ipAddress: a.ipAddress,
        geoLocation: a.geoLocation,
        success: a.success,
        timestamp: a.timestamp
      }));

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify({ feed, totalEvents: recentActivities.length }, null, 2)
          }
        ]
      };
    } catch (err: any) {
      throw new Error(`Failed to query activity feed: ${err.message}`);
    }
  }

  throw new Error("Resource not found");
});

// 3. Register tools (Action hooks for LLM retrieval and agentic execution)
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_security_alerts",
        description: "Retrieve critical cybersecurity alerts, malware signature detections, steganography blocks, and PII leaks from the database.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of threat reports to query (default: 10, max: 50)" }
          }
        }
      },
      {
        name: "get_audit_logs",
        description: "Query system access trails, continuous biometrics telemetry hold times, mouse jitters, travel velocity records, and authentication checks.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of logs to query (default: 20, max: 100)" }
          }
        }
      },
      {
        name: "query_blockchain_metadata",
        description: "Fetch immutable file integrity digital signatures, IPFS CIDs, registered hashes, and EVM contract transaction block receipts from the ledger.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of registry files to query (default: 10, max: 50)" }
          }
        }
      },
      {
        name: "get_file_provenance",
        description: "Retrieve the complete lifecycle history of a specific file: upload origin, all downloads, shares, access attempts, and geographic distribution.",
        inputSchema: {
          type: "object",
          properties: {
            fileId: { type: "string", description: "The MongoDB ObjectId of the file to trace" },
            limit: { type: "number", description: "Maximum number of activity records (default: 30, max: 100)" }
          },
          required: ["fileId"]
        }
      },
      {
        name: "get_file_analytics",
        description: "Get aggregate statistics for a specific file: total downloads, shares, unique viewers, geographic access map, and activity timeline.",
        inputSchema: {
          type: "object",
          properties: {
            fileId: { type: "string", description: "The MongoDB ObjectId of the file to analyze" }
          },
          required: ["fileId"]
        }
      },
      {
        name: "get_global_activity",
        description: "Retrieve system-wide file activity analytics: most downloaded files, most active users, geographic heatmap, and recent activity feed.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of recent activities (default: 20, max: 50)" }
          }
        }
      },
      {
        name: "run_agent_swarm",
        description: "Execute the AI Agent Swarm: runs Scanner, Responder, Forensics, and Compliance agents in parallel to produce a comprehensive security assessment with findings, recommendations, and MITRE mappings.",
        inputSchema: {
          type: "object",
          properties: {
            agentName: { type: "string", description: "Specific agent (Scanner/Responder/Forensics/Compliance), or omit for full swarm" }
          }
        }
      },
      {
        name: "get_threat_forecast",
        description: "Get the Predictive Threat Oracle 72-hour forecast: predicted threats, confidence scores, threat weather, time-series data, and mitigation recommendations.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_global_threat_map",
        description: "Get active global threat events with source/target geolocations for topology map visualization.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum threats (default: 30, max: 100)" }
          }
        }
      }
    ]
  }
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const limit = Math.min((args as any)?.limit || 10, 100);

  try {
    // Tool A: Security Alerts
    if (name === "get_security_alerts") {
      const reports = await ThreatReport.find().sort({ createdAt: -1 }).limit(limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(reports, null, 2)
          }
        ]
      };
    }

    // Tool B: Audit Logs
    if (name === "get_audit_logs") {
      const audits = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(audits, null, 2)
          }
        ]
      };
    }

    // Tool C: Blockchain File Registry
    if (name === "query_blockchain_metadata") {
      const files = await FileDocument.find({ blockchainTxHash: { $exists: true } })
        .populate("owner", "username email")
        .sort({ createdAt: -1 })
        .limit(limit);

      const registry = files.map(f => ({
        fileName: f.fileName,
        fileHash: f.fileHash,
        cid: f.cid,
        blockchainTxHash: f.blockchainTxHash,
        digitalSignature: f.digitalSignature,
        owner: (f.owner as any)?.username || "Unknown",
        createdAt: f.createdAt
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(registry, null, 2)
          }
        ]
      };
    }

    // Tool D: File Provenance (NEW)
    if (name === "get_file_provenance") {
      const fileId = (args as any)?.fileId;
      if (!fileId) {
        return {
          isError: true,
          content: [{ type: "text", text: "Error: fileId is required." }]
        };
      }

      const file = await FileDocument.findById(fileId);
      if (!file) {
        return {
          isError: true,
          content: [{ type: "text", text: `File not found: ${fileId}` }]
        };
      }

      const activities = await FileActivity.find({ fileId })
        .sort({ timestamp: -1 })
        .limit(limit);

      const provenance = {
        file: {
          fileName: file.fileName,
          fileSize: file.fileSize,
          cid: file.cid,
          fileHash: file.fileHash,
          threatScore: file.threatScore,
          uploadOrigin: {
            ipAddress: file.uploadIpAddress,
            geoLocation: file.uploadGeoLocation,
            deviceFingerprint: file.uploadDeviceFingerprint
          },
          activityCounters: {
            totalDownloads: file.totalDownloads || 0,
            totalShares: file.totalShares || 0,
            uniqueViewers: file.uniqueViewerCount || 0
          },
          lastAccess: {
            at: file.lastAccessedAt,
            by: file.lastAccessedBy,
            from: file.lastAccessedByGeo
          },
          versionNumber: file.versionNumber || 1
        },
        activities: activities.map((a: any) => ({
          eventType: a.eventType,
          performedBy: a.performedByUsername,
          timestamp: a.timestamp,
          ipAddress: a.ipAddress,
          geoLocation: a.geoLocation,
          recipientUsername: a.recipientUsername,
          success: a.success,
          failureReason: a.failureReason
        }))
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(provenance, null, 2)
          }
        ]
      };
    }

    // Tool E: File Analytics (NEW)
    if (name === "get_file_analytics") {
      const fileId = (args as any)?.fileId;
      if (!fileId) {
        return {
          isError: true,
          content: [{ type: "text", text: "Error: fileId is required." }]
        };
      }

      const file = await FileDocument.findById(fileId);
      if (!file) {
        return {
          isError: true,
          content: [{ type: "text", text: `File not found: ${fileId}` }]
        };
      }

      const activityCounts = await FileActivity.aggregate([
        { $match: { fileId: fileId } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } }
      ]);

      const accessLocations = await FileActivity.aggregate([
        { $match: { fileId: fileId, success: true } },
        { $group: { _id: "$ipAddress", count: { $sum: 1 }, location: { $first: "$geoLocation" } } }
      ]);

      const analytics = {
        fileName: file.fileName,
        totalDownloads: file.totalDownloads || 0,
        totalShares: file.totalShares || 0,
        uniqueViewers: file.uniqueViewerCount || 0,
        activityByType: activityCounts.map((c: any) => ({ type: c._id, count: c.count })),
        accessLocations: accessLocations.map((l: any) => ({
          ip: l._id,
          count: l.count,
          city: l.location?.city || "Unknown",
          country: l.location?.country || "Unknown"
        }))
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analytics, null, 2)
          }
        ]
      };
    }

    // Tool F: Global Activity (NEW)
    if (name === "get_global_activity") {
      const recentActivities = await FileActivity.find()
        .sort({ timestamp: -1 })
        .limit(limit);

      const totalFiles = await FileDocument.countDocuments();
      const totalActivities = await FileActivity.countDocuments({});

      const activityByType = await FileActivity.aggregate([
        { $group: { _id: "$eventType", count: { $sum: 1 } } }
      ]);

      const topDownloaded = await FileDocument.find({ isRecycled: false })
        .sort({ totalDownloads: -1 })
        .limit(5)
        .select("fileName totalDownloads totalShares");

      const topShared = await FileDocument.find({ isRecycled: false })
        .sort({ totalShares: -1 })
        .limit(5)
        .select("fileName totalShares totalDownloads");

      const globalActivity = {
        overview: { totalFiles, totalActivities },
        activityBreakdown: activityByType.map((a: any) => ({ type: a._id, count: a.count })),
        topDownloadedFiles: topDownloaded,
        topSharedFiles: topShared,
        recentActivity: recentActivities.map((a: any) => ({
          eventType: a.eventType,
          fileName: a.fileName,
          performedBy: a.performedByUsername,
          ipAddress: a.ipAddress,
          geoLocation: a.geoLocation,
          success: a.success,
          timestamp: a.timestamp
        }))
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(globalActivity, null, 2)
          }
        ]
      };
    }

    // Tool G: Run Agent Swarm
    if (name === "run_agent_swarm") {
      const agentName = (args as any)?.agentName;
      let result;
      if (agentName) {
        result = await agentSwarm.runAgent(agentName);
      } else {
        result = await agentSwarm.runFullAnalysis();
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    // Tool H: Get Threat Forecast
    if (name === "get_threat_forecast") {
      const forecast = await generateForecast();
      return {
        content: [{ type: "text", text: JSON.stringify(forecast, null, 2) }]
      };
    }

    // Tool I: Get Global Threat Map
    if (name === "get_global_threat_map") {
      const threatLimit = Math.min((args as any)?.limit || 30, 100);
      const threats = await ThreatIntelligence.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(threatLimit);
      const threatMap = threats.map((t: any) => ({
        eventType: t.eventType,
        severity: t.severity,
        source: t.sourceGeo,
        target: t.targetGeo,
        threatScore: t.threatScore,
        description: t.description,
        mitreTactic: t.mitreTactic,
        timestamp: t.createdAt
      }));
      return {
        content: [{ type: "text", text: JSON.stringify({ total: threatMap.length, threats: threatMap }, null, 2) }]
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${err.message}`
        }
      ]
    };
  }
});
