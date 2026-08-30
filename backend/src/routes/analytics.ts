import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { zeroTrustGuard } from "../middleware/zeroTrustGuard";
import {
  getFileActivityTimeline,
  getFileStats,
  getGlobalAnalytics,
  getGeoHeatmap,
  getActivityFeed,
  getComplianceExport
} from "../controllers/fileAnalyticsController";

const router = Router();

// === Per-File Analytics (requires authentication) ===

// Complete activity timeline for a specific file
router.get(
  "/files/:fileId/activity",
  authenticateJWT,
  zeroTrustGuard(),
  getFileActivityTimeline
);

// Aggregate statistics for a specific file
router.get(
  "/files/:fileId/stats",
  authenticateJWT,
  zeroTrustGuard(),
  getFileStats
);

// === Global Analytics (admin-level access) ===

// System-wide analytics: top files, most active users, risk data
router.get(
  "/global",
  authenticateJWT,
  zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]),
  getGlobalAnalytics
);

// Geographic heatmap data for all file access events
router.get(
  "/geo-heatmap",
  authenticateJWT,
  zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]),
  getGeoHeatmap
);

// Real-time activity feed across all files
router.get(
  "/activity-feed",
  authenticateJWT,
  zeroTrustGuard(),
  getActivityFeed
);

// === Compliance Export ===

// Full audit trail export for compliance (SOC 2 / GDPR / ISO 27001)
router.get(
  "/compliance-export",
  authenticateJWT,
  zeroTrustGuard(["Super Admin", "Admin", "Auditor", "Compliance Officer"]),
  getComplianceExport
);

export default router;
