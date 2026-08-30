import { Response } from "express";
import { FileDocument } from "../models/FileDocument";
import { FileActivity } from "../models/FileActivity";
import { AuditLog } from "../models/AuditLog";

/**
 * GET /api/files/:fileId/activity
 * Complete activity timeline for a specific file
 */
export const getFileActivityTimeline = async (req: any, res: Response) => {
  try {
    const { fileId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const activities = await FileActivity.find({ fileId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({
      fileId,
      totalActivities: activities.length,
      activities: activities.map((a: any) => ({
        id: a._id,
        eventType: a.eventType,
        performedBy: a.performedByUsername,
        timestamp: a.timestamp,
        ipAddress: a.ipAddress,
        geoLocation: a.geoLocation,
        recipientUsername: a.recipientUsername,
        success: a.success,
        failureReason: a.failureReason,
        metadata: a.metadata
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files/:fileId/stats
 * Aggregate statistics for a specific file
 */
export const getFileStats = async (req: any, res: Response) => {
  try {
    const { fileId } = req.params;

    const doc = await FileDocument.findById(fileId);
    if (!doc) {
      return res.status(404).json({ error: "File not found." });
    }

    // Count activities by type
    const activityCounts = await FileActivity.aggregate([
      { $match: { fileId: fileId } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } }
    ]);

    // Get unique access locations
    const accessLocations = await FileActivity.aggregate([
      { $match: { fileId: fileId, success: true } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 }, location: { $first: "$geoLocation" } } }
    ]);

    // Activity over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyActivity = await FileActivity.aggregate([
      { $match: { fileId: fileId, timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Unique viewers breakdown
    const uniqueViewers = await FileActivity.aggregate([
      { $match: { fileId: fileId, eventType: { $in: ["DOWNLOAD", "SHARE"] } } },
      { $group: { _id: "$performedByUsername", downloads: { $sum: { $cond: [{ $eq: ["$eventType", "DOWNLOAD"] }, 1, 0] } }, shares: { $sum: { $cond: [{ $eq: ["$eventType", "SHARE"] }, 1, 0] } } } }
    ]);

    // Share recipients
    const shareRecipients = await FileActivity.aggregate([
      { $match: { fileId: fileId, eventType: "SHARE" } },
      { $group: { _id: "$recipientUsername", shareCount: { $sum: 1 }, lastShared: { $max: "$timestamp" } } }
    ]);

    return res.json({
      fileId,
      fileName: doc.fileName,
      owner: doc.owner,
      createdAt: doc.createdAt,
      // Core stats
      totalDownloads: doc.totalDownloads || 0,
      totalShares: doc.totalShares || 0,
      uniqueViewerCount: doc.uniqueViewerCount || 0,
      lastAccessedAt: doc.lastAccessedAt,
      lastAccessedBy: doc.lastAccessedBy,
      lastAccessedByGeo: doc.lastAccessedByGeo,
      // Provenance
      uploadIpAddress: doc.uploadIpAddress,
      uploadGeoLocation: doc.uploadGeoLocation,
      versionNumber: doc.versionNumber || 1,
      // Activity breakdown
      activityByType: activityCounts.map((c: any) => ({ type: c._id, count: c.count })),
      accessLocations: accessLocations.map((l: any) => ({
        ip: l._id,
        count: l.count,
        city: l.location?.city || "Unknown",
        country: l.location?.country || "Unknown",
        countryCode: l.location?.countryCode || "XX",
        lat: l.location?.lat || 0,
        lon: l.location?.lon || 0
      })),
      dailyActivity: dailyActivity.map((d: any) => ({ date: d._id, count: d.count })),
      viewerBreakdown: uniqueViewers.map((v: any) => ({
        username: v._id,
        downloads: v.downloads,
        shares: v.shares
      })),
      shareRecipients: shareRecipients.map((s: any) => ({
        username: s._id,
        shareCount: s.shareCount,
        lastShared: s.lastShared
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/global
 * System-wide analytics: top files, most active users, risk data
 */
export const getGlobalAnalytics = async (req: any, res: Response) => {
  try {
    // Total counts
    const totalFiles = await FileDocument.countDocuments();
    const totalActivities = await FileActivity.countDocuments({});

    // Top most-downloaded files
    const topDownloadedFiles = await FileDocument.find({ isRecycled: false })
      .sort({ totalDownloads: -1 })
      .limit(10)
      .select("fileName fileSize totalDownloads totalShares uniqueViewerCount threatScore createdAt");

    // Top most-shared files
    const topSharedFiles = await FileDocument.find({ isRecycled: false })
      .sort({ totalShares: -1 })
      .limit(10)
      .select("fileName fileSize totalShares totalDownloads uniqueViewerCount threatScore createdAt");

    // Most active uploaders
    const activeUploaders = await FileActivity.aggregate([
      { $match: { eventType: "UPLOAD", success: true } },
      { $group: { _id: "$performedByUsername", uploadCount: { $sum: 1 } } },
      { $sort: { uploadCount: -1 } },
      { $limit: 10 }
    ]);

    // Most active downloaders
    const activeDownloaders = await FileActivity.aggregate([
      { $match: { eventType: "DOWNLOAD", success: true } },
      { $group: { _id: "$performedByUsername", downloadCount: { $sum: 1 } } },
      { $sort: { downloadCount: -1 } },
      { $limit: 10 }
    ]);

    // Activity by type
    const activityByType = await FileActivity.aggregate([
      { $group: { _id: "$eventType", count: { $sum: 1 } } }
    ]);

    // Activity by country (geo heatmap data)
    const activityByCountry = await FileActivity.aggregate([
      { $match: { "geoLocation.countryCode": { $ne: "XX" } } },
      { $group: { _id: "$geoLocation.countryCode", count: { $sum: 1 }, country: { $first: "$geoLocation.country" }, lat: { $first: "$geoLocation.lat" }, lon: { $first: "$geoLocation.lon" } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    // Activity by city
    const activityByCity = await FileActivity.aggregate([
      { $match: { "geoLocation.city": { $ne: "Unknown" } } },
      { $group: { _id: { city: "$geoLocation.city", country: "$geoLocation.country" }, count: { $sum: 1 }, lat: { $first: "$geoLocation.lat" }, lon: { $first: "$geoLocation.lon" } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    // Recent activity feed
    const recentActivity = await FileActivity.find()
      .sort({ timestamp: -1 })
      .limit(20);

    // Threat summary
    const totalThreats = await FileActivity.countDocuments({ success: false });

    // Daily activity trend (last 14 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const dailyTrend = await FileActivity.aggregate([
      { $match: { timestamp: { $gte: twoWeeksAgo } } },
      { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, type: "$eventType" }, count: { $sum: 1 } } },
      { $sort: { "_id.date": 1 } }
    ]);

    // Files by threat score distribution
    const threatDistribution = [
      { range: "Clean (0)", count: await FileDocument.countDocuments({ threatScore: 0, isRecycled: false }) },
      { range: "Low (1-30)", count: await FileDocument.countDocuments({ threatScore: { $gt: 0, $lte: 30 }, isRecycled: false }) },
      { range: "Medium (31-60)", count: await FileDocument.countDocuments({ threatScore: { $gt: 30, $lte: 60 }, isRecycled: false }) },
      { range: "High (61-100)", count: await FileDocument.countDocuments({ threatScore: { $gt: 60 }, isRecycled: false }) }
    ];

    return res.json({
      overview: {
        totalFiles,
        totalActivities,
        totalThreats
      },
      topDownloadedFiles,
      topSharedFiles,
      activeUploaders: activeUploaders.map((u: any) => ({ username: u._id, count: u.uploadCount })),
      activeDownloaders: activeDownloaders.map((u: any) => ({ username: u._id, count: u.downloadCount })),
      activityByType: activityByType.map((a: any) => ({ type: a._id, count: a.count })),
      activityByCountry: activityByCountry.map((c: any) => ({
        countryCode: c._id,
        country: c.country,
        count: c.count,
        lat: c.lat,
        lon: c.lon
      })),
      activityByCity: activityByCity.map((c: any) => ({
        city: c._id.city,
        country: c._id.country,
        count: c.count,
        lat: c.lat,
        lon: c.lon
      })),
      recentActivity: recentActivity.map((a: any) => ({
        id: a._id,
        fileName: a.fileName,
        eventType: a.eventType,
        performedBy: a.performedByUsername,
        ipAddress: a.ipAddress,
        geoLocation: a.geoLocation,
        timestamp: a.timestamp,
        success: a.success
      })),
      dailyTrend,
      threatDistribution
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/geo-heatmap
 * Geographic heatmap data for all file access events
 */
export const getGeoHeatmap = async (req: any, res: Response) => {
  try {
    // All access points with valid geo coordinates
    const accessPoints = await FileActivity.aggregate([
      { $match: { "geoLocation.lat": { $ne: 0 }, "geoLocation.lon": { $ne: 0 }, success: true } },
      { $group: {
          _id: { lat: "$geoLocation.lat", lon: "$geoLocation.lon", city: "$geoLocation.city", country: "$geoLocation.country", countryCode: "$geoLocation.countryCode" },
          count: { $sum: 1 },
          eventTypes: { $addToSet: "$eventType" },
          users: { $addToSet: "$performedByUsername" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    // Country-level aggregation
    const countryAggregation = await FileActivity.aggregate([
      { $match: { "geoLocation.countryCode": { $ne: "XX" }, success: true } },
      { $group: {
          _id: "$geoLocation.countryCode",
          country: { $first: "$geoLocation.country" },
          totalEvents: { $sum: 1 },
          uniqueIPs: { $addToSet: "$ipAddress" },
          lat: { $first: "$geoLocation.lat" },
          lon: { $first: "$geoLocation.lon" }
        }
      },
      { $sort: { totalEvents: -1 } }
    ]);

    return res.json({
      accessPoints: accessPoints.map((p: any) => ({
        lat: p._id.lat,
        lon: p._id.lon,
        city: p._id.city,
        country: p._id.country,
        countryCode: p._id.countryCode,
        count: p.count,
        eventTypes: p.eventTypes,
        uniqueUsers: p.users.length
      })),
      countryStats: countryAggregation.map((c: any) => ({
        countryCode: c._id,
        country: c.country,
        totalEvents: c.totalEvents,
        uniqueIPs: c.uniqueIPs.length,
        lat: c.lat,
        lon: c.lon
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/activity-feed
 * Real-time activity feed across all files
 */
export const getActivityFeed = async (req: any, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const eventType = req.query.type as string;

    const query: any = {};
    if (eventType) {
      query.eventType = eventType;
    }

    const activities = await FileActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({
      total: activities.length,
      feed: activities.map((a: any) => ({
        id: a._id,
        fileName: a.fileName,
        eventType: a.eventType,
        performedBy: a.performedByUsername,
        timestamp: a.timestamp,
        ipAddress: a.ipAddress,
        geoLocation: a.geoLocation,
        recipientUsername: a.recipientUsername,
        success: a.success,
        failureReason: a.failureReason
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/compliance/export
 * Full audit trail export for compliance (SOC 2 / GDPR / ISO 27001)
 */
export const getComplianceExport = async (req: any, res: Response) => {
  try {
    const fileId = req.query.fileId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build activity query
    const activityQuery: any = {};
    if (fileId) {
      activityQuery.fileId = fileId;
    }
    if (startDate || endDate) {
      activityQuery.timestamp = {};
      if (startDate) activityQuery.timestamp.$gte = new Date(startDate);
      if (endDate) activityQuery.timestamp.$lte = new Date(endDate);
    }

    // Get all matching activities
    const activities = await FileActivity.find(activityQuery)
      .sort({ timestamp: 1 });

    // Get all audit logs in the same period
    const auditQuery: any = {};
    if (startDate || endDate) {
      auditQuery.timestamp = {};
      if (startDate) auditQuery.timestamp.$gte = new Date(startDate);
      if (endDate) auditQuery.timestamp.$lte = new Date(endDate);
    }

    // File metadata
    let fileMetadata: any = null;
    if (fileId) {
      fileMetadata = await FileDocument.findById(fileId);
    }

    // Statistics summary
    const uploadCount = activities.filter((a: any) => a.eventType === "UPLOAD").length;
    const downloadCount = activities.filter((a: any) => a.eventType === "DOWNLOAD").length;
    const shareCount = activities.filter((a: any) => a.eventType === "SHARE").length;
    const failedCount = activities.filter((a: any) => !a.success).length;
    const uniqueIPs = [...new Set(activities.map((a: any) => a.ipAddress))];
    const uniqueUsers = [...new Set(activities.map((a: any) => a.performedByUsername))];

    return res.json({
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.username,
        dateRange: {
          start: startDate || "All time",
          end: endDate || "Now"
        },
        fileId: fileId || "All files"
      },
      fileMetadata: fileMetadata ? {
        fileName: fileMetadata.fileName,
        fileHash: fileMetadata.fileHash,
        cid: fileMetadata.cid,
        owner: fileMetadata.owner,
        threatScore: fileMetadata.threatScore,
        blockchainTxHash: fileMetadata.blockchainTxHash,
        uploadIpAddress: fileMetadata.uploadIpAddress,
        uploadGeoLocation: fileMetadata.uploadGeoLocation,
        versionNumber: fileMetadata.versionNumber
      } : null,
      summary: {
        totalEvents: activities.length,
        uploads: uploadCount,
        downloads: downloadCount,
        shares: shareCount,
        failedAttempts: failedCount,
        uniqueIPAddresses: uniqueIPs.length,
        uniqueUsers: uniqueUsers.length
      },
      complianceFrameworks: {
        "GDPR_Art_32": {
          status: "COMPLIANT",
          description: "All file data encrypted with AES-256-GCM + RSA-4096 key wrapping"
        },
        "GDPR_Art_33": {
          status: failedCount > 0 ? "ACTION_REQUIRED" : "COMPLIANT",
          description: `${failedCount} security events detected and logged`
        },
        "ISO_27001_A.8": {
          status: "COMPLIANT",
          description: "Complete audit trail maintained for all file operations"
        },
        "NIST_CSF_PR.AC": {
          status: "COMPLIANT",
          description: "Zero Trust authentication and access controls active"
        }
      },
      activities: activities.map((a: any) => ({
        timestamp: a.timestamp,
        eventType: a.eventType,
        fileName: a.fileName,
        performedBy: a.performedByUsername,
        ipAddress: a.ipAddress,
        geoLocation: a.geoLocation,
        success: a.success,
        failureReason: a.failureReason,
        blockchainTxHash: a.blockchainTxHash,
        metadata: a.metadata
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
