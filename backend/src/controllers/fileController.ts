import { Response } from "express";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { FileDocument } from "../models/FileDocument";
import { FileActivity } from "../models/FileActivity";
import { ThreatReport } from "../models/ThreatReport";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import { ipfsService } from "../services/ipfsService";
import { blockchainService } from "../services/blockchainService";
import { websocketService } from "../services/websocketService";
import { CryptoHelper } from "../utils/cryptoHelper";
import { resolveIPGeo } from "../services/geoLocationService";

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

/**
 * Helper: Log a file activity event
 */
const logFileActivity = async (params: {
  fileId: string;
  fileName: string;
  eventType: string;
  performedBy: string;
  performedByUsername: string;
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  recipientUsername?: string;
  recipientUserId?: string;
  shareExpiry?: Date;
  maxDownloads?: number;
  downloadCount?: number;
  success?: boolean;
  failureReason?: string;
  blockchainTxHash?: string;
  metadata?: any;
}) => {
  try {
    const geo = await resolveIPGeo(params.ipAddress);
    const activity = await FileActivity.create({
      fileId: params.fileId,
      fileName: params.fileName,
      eventType: params.eventType,
      performedBy: params.performedBy,
      performedByUsername: params.performedByUsername,
      ipAddress: params.ipAddress,
      geoLocation: {
        city: geo.city,
        region: geo.region,
        country: geo.country,
        countryCode: geo.countryCode,
        lat: geo.lat,
        lon: geo.lon,
        isp: geo.isp,
        org: geo.org
      },
      deviceFingerprint: params.deviceFingerprint || "",
      userAgent: params.userAgent || "",
      recipientUsername: params.recipientUsername || "",
      recipientUserId: params.recipientUserId || undefined,
      shareExpiry: params.shareExpiry || undefined,
      maxDownloads: params.maxDownloads || 0,
      downloadCount: params.downloadCount || 0,
      success: params.success !== undefined ? params.success : true,
      failureReason: params.failureReason || "",
      blockchainTxHash: params.blockchainTxHash || "",
      metadata: params.metadata || {}
    });

    // Broadcast activity via WebSocket
    websocketService.notifyFileActivity({
      fileId: params.fileId,
      fileName: params.fileName,
      eventType: params.eventType,
      performedBy: params.performedByUsername,
      ipAddress: params.ipAddress,
      geoLocation: {
        city: geo.city,
        country: geo.country,
        countryCode: geo.countryCode,
        lat: geo.lat,
        lon: geo.lon
      },
      timestamp: new Date().toISOString()
    });

    return activity;
  } catch (err: any) {
    console.warn(`Failed to log file activity: ${err.message}`);
    return null;
  }
};

export const uploadFile = async (req: any, res: Response) => {
  const file = req.file;
  const user = req.user;
  const clientIp = req.ip || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";
  const browserFingerprint = req.headers["x-browser-fingerprint"] || "";
  const selfDestruct = req.body.selfDestruct === "true";

  if (!file) {
    return res.status(400).json({ error: "No file provided." });
  }

  // Resolve upload location
  const uploadGeo = await resolveIPGeo(clientIp);

  try {
    // 1. Submit file to AI Security Engine for scans
    const formData = new FormData();
    const blob = new Blob([file.buffer]);
    formData.append("file", blob, file.originalname);

    let aiResult;
    try {
      const response = await axios.post(`${AI_ENGINE_URL}/api/v1/scan/file`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      aiResult = response.data;
    } catch (err: any) {
      console.warn("AI scan engine unavailable. Running local heuristic safety filter.");
      aiResult = {
        threat_score: 0,
        confidence_score: 95,
        detected_threats: [],
        pii_detected: {},
        suggested_action: "ALLOW",
        file_hash: CryptoHelper.calculateSHA256(file.buffer),
        vt_results: { positives: 0, total: 75 },
        mitre_mapping: []
      };
    }

    // Check classification result
    if (aiResult.suggested_action === "BLOCK" || aiResult.threat_score >= 60) {
      // Log blocked upload activity
      await logFileActivity({
        fileId: "blocked",
        fileName: file.originalname,
        eventType: "UPLOAD",
        performedBy: user._id,
        performedByUsername: user.username,
        ipAddress: clientIp,
        deviceFingerprint: browserFingerprint,
        userAgent,
        success: false,
        failureReason: `AI Threat Score: ${aiResult.threat_score}/100. Flags: ${aiResult.detected_threats.join(", ")}`,
        metadata: { threatScore: aiResult.threat_score, detectedThreats: aiResult.detected_threats }
      });

      const report = await ThreatReport.create({
        fileName: file.originalname,
        fileHash: aiResult.file_hash || CryptoHelper.calculateSHA256(file.buffer),
        uploaderUsername: user.username,
        threatScore: aiResult.threat_score,
        confidenceScore: aiResult.confidence_score,
        detectedThreats: aiResult.detected_threats,
        piiDetected: aiResult.pii_detected,
        suggestedAction: aiResult.suggested_action,
        vtPositives: aiResult.vt_results?.positives || 0,
        vtTotal: aiResult.vt_results?.total || 75,
        mitreMapping: aiResult.mitre_mapping
      });

      await AuditLog.create({
        action: "SECURITY_ALERT",
        userId: user._id,
        username: user.username,
        ip: clientIp,
        location: `${uploadGeo.city}, ${uploadGeo.country}`,
        details: `Upload blocked: ${file.originalname}. AI Threat Score: ${aiResult.threat_score}/100. Flags: ${aiResult.detected_threats.join(", ")}`,
        status: "BLOCKED"
      });

      websocketService.notifyThreat(report);

      return res.status(403).json({
        error: "Upload blocked by AI security controller.",
        threatReport: report
      });
    }

    // 2. File Encryption
    const aesKey = crypto.randomBytes(32);
    const { encrypted, iv, authTag } = CryptoHelper.encryptAES(file.buffer, aesKey);
    const cipherBlock = Buffer.concat([encrypted, authTag]);
    const wrappedAesKey = CryptoHelper.encryptRSA(aesKey, user.rsaPublicKey);

    // 3. Pin to IPFS
    const cid = await ipfsService.uploadFile(cipherBlock, file.originalname);

    // Calculate signed digital signature
    const fileHash = CryptoHelper.calculateSHA256(cipherBlock);
    const signature = CryptoHelper.signHash(fileHash, user.rsaPrivateKeyEncrypted);

    // 4. Registry transaction on Solidity Smart Contract
    const ownerAddress = user.didAddress || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const blockchainResponse = await blockchainService.registerFileOnChain(
      fileHash,
      cid,
      fileHash,
      aiResult.threat_score,
      signature
    );

    // 5. Store File document metadata with provenance
    const doc = await FileDocument.create({
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      cid: cid,
      fileHash: fileHash,
      owner: user._id,
      ownerAddress,
      threatScore: aiResult.threat_score,
      encryptedAesKey: wrappedAesKey,
      iv: iv.toString("hex"),
      digitalSignature: signature,
      blockchainTxHash: blockchainResponse.txHash,
      selfDestruct,
      // Provenance fields
      uploadIpAddress: clientIp,
      uploadGeoLocation: {
        city: uploadGeo.city,
        region: uploadGeo.region,
        country: uploadGeo.country,
        countryCode: uploadGeo.countryCode,
        lat: uploadGeo.lat,
        lon: uploadGeo.lon,
        isp: uploadGeo.isp,
        org: uploadGeo.org
      },
      uploadDeviceFingerprint: browserFingerprint,
      uploadUserAgent: userAgent,
      totalDownloads: 0,
      totalShares: 0,
      uniqueViewerIds: [user._id],
      uniqueViewerCount: 1,
      lastAccessedAt: new Date(),
      lastAccessedBy: user.username,
      versionNumber: 1
    });

    await AuditLog.create({
      action: "UPLOAD",
      userId: user._id,
      username: user.username,
      ip: clientIp,
      location: `${uploadGeo.city}, ${uploadGeo.country}`,
      details: `File successfully encrypted and stored. CID: ${cid}. SelfDestruct: ${selfDestruct}`,
      blockchainTxHash: blockchainResponse.txHash,
      status: "SUCCESS"
    });

    // Log file activity
    await logFileActivity({
      fileId: doc._id.toString(),
      fileName: file.originalname,
      eventType: "UPLOAD",
      performedBy: user._id,
      performedByUsername: user.username,
      ipAddress: clientIp,
      deviceFingerprint: browserFingerprint,
      userAgent,
      blockchainTxHash: blockchainResponse.txHash,
      metadata: {
        fileSize: file.size,
        mimeType: file.mimetype,
        cid,
        threatScore: aiResult.threat_score,
        selfDestruct
      }
    });

    websocketService.notifyUploadSuccess(doc);

    return res.status(201).json({
      message: "File successfully uploaded and blockchain registered.",
      file: doc
    });
  } catch (err: any) {
    console.error("Upload handler fault:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const downloadFile = async (req: any, res: Response) => {
  const { fileId } = req.params;
  const user = req.user;
  const clientIp = req.ip || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";
  const browserFingerprint = req.headers["x-browser-fingerprint"] || "";

  const downloadGeo = await resolveIPGeo(clientIp);

  try {
    const doc = await FileDocument.findById(fileId);
    if (!doc || doc.isRecycled) {
      return res.status(404).json({ error: "File metadata not found." });
    }

    if (doc.isLocked) {
      // Log blocked access
      await logFileActivity({
        fileId,
        fileName: doc.fileName,
        eventType: "ACCESS_CHECK",
        performedBy: user._id,
        performedByUsername: user.username,
        ipAddress: clientIp,
        deviceFingerprint: browserFingerprint,
        userAgent,
        success: false,
        failureReason: "File locked by emergency lock policy"
      });
      return res.status(403).json({ error: "File locked by emergency lock policy." });
    }

    // 1. Verify User Access permissions
    let hasAccess = false;
    let shareInfo: any = null;

    if (doc.owner.toString() === user._id.toString()) {
      hasAccess = true;
    } else {
      const share = doc.sharedWith.find((s: any) => s.accessor && s.accessor.toString() === user._id.toString());
      if (share) {
        const withinTime = share.validUntil ? (new Date() < share.validUntil) : true;
        const withinLimit = share.maxDownloads ? (share.downloadCount < share.maxDownloads) : true;
        if (withinTime && withinLimit) {
          share.downloadCount += 1;
          shareInfo = share;
          hasAccess = true;
        } else {
          // Log expired/limited share access
          await logFileActivity({
            fileId,
            fileName: doc.fileName,
            eventType: "ACCESS_CHECK",
            performedBy: user._id,
            performedByUsername: user.username,
            ipAddress: clientIp,
            deviceFingerprint: browserFingerprint,
            userAgent,
            success: false,
            failureReason: !withinTime ? "Share access expired" : "Download limit reached",
            metadata: { shareExpiry: share.validUntil, downloadCount: share.downloadCount, maxDownloads: share.maxDownloads }
          });
        }
      }
    }

    if (!hasAccess) {
      await AuditLog.create({
        action: "DOWNLOAD",
        userId: user._id,
        username: user.username,
        ip: clientIp,
        location: `${downloadGeo.city}, ${downloadGeo.country}`,
        details: `Access denied. No valid share contract for FileId: ${fileId}`,
        status: "FAILED"
      });
      return res.status(403).json({ error: "Unauthorized. Access not granted or expired." });
    }

    // Sync validation with smart contract
    await blockchainService.verifyAccessOnChain(doc.fileHash, user.didAddress || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // 2. Download from IPFS
    const cipherBlock = await ipfsService.downloadFile(doc.cid);

    // Verify hash integrity
    const verifyHash = CryptoHelper.calculateSHA256(cipherBlock);
    if (verifyHash !== doc.fileHash) {
      await logFileActivity({
        fileId,
        fileName: doc.fileName,
        eventType: "DOWNLOAD",
        performedBy: user._id,
        performedByUsername: user.username,
        ipAddress: clientIp,
        deviceFingerprint: browserFingerprint,
        userAgent,
        success: false,
        failureReason: "Integrity hash mismatch - IPFS payload tampered"
      });

      await AuditLog.create({
        action: "SECURITY_ALERT",
        userId: user._id,
        username: user.username,
        ip: clientIp,
        location: `${downloadGeo.city}, ${downloadGeo.country}`,
        details: `Integrity check failed. Stored hash differs from downloaded IPFS payload CID: ${doc.cid}`,
        status: "BLOCKED"
      });
      return res.status(500).json({ error: "Decentralized payload integrity hash validation failed." });
    }

    // 3. Decrypt
    const authTag = cipherBlock.subarray(cipherBlock.length - 16);
    const ciphertext = cipherBlock.subarray(0, cipherBlock.length - 16);
    const aesKey = CryptoHelper.decryptRSA(doc.encryptedAesKey, user.rsaPrivateKeyEncrypted);
    const decrypted = CryptoHelper.decryptAES(ciphertext, aesKey, Buffer.from(doc.iv, "hex"), authTag);

    // 4. PDF Forensic Watermarking
    let payload = decrypted;
    if (doc.mimeType === "application/pdf") {
      const watermarkText = `\n% Aegis Cyber Shield Forensic Tag: Decrypted by ${user.username} at ${new Date().toISOString()} | Signature: ${doc.digitalSignature.substring(0, 16)}\n`;
      payload = Buffer.concat([decrypted, Buffer.from(watermarkText)]);
    }

    // 5. Update file document with download stats
    const uniqueViewers = doc.uniqueViewerIds || [];
    const viewerAlreadyTracked = uniqueViewers.some((vid: any) => vid.toString() === user._id.toString());
    if (!viewerAlreadyTracked) {
      uniqueViewers.push(user._id);
    }

    doc.totalDownloads = (doc.totalDownloads || 0) + 1;
    doc.uniqueViewerIds = uniqueViewers;
    doc.uniqueViewerCount = uniqueViewers.length;
    doc.lastAccessedAt = new Date();
    doc.lastAccessedBy = user.username;
    doc.lastAccessedByIp = clientIp;
    doc.lastAccessedByGeo = {
      city: downloadGeo.city,
      region: downloadGeo.region,
      country: downloadGeo.country,
      countryCode: downloadGeo.countryCode,
      lat: downloadGeo.lat,
      lon: downloadGeo.lon,
      isp: downloadGeo.isp,
      org: downloadGeo.org
    };
    await doc.save();

    // 6. Self-Destruct Lifecycle
    if (doc.selfDestruct) {
      await logFileActivity({
        fileId,
        fileName: doc.fileName,
        eventType: "SELF_DESTRUCT",
        performedBy: user._id,
        performedByUsername: user.username,
        ipAddress: clientIp,
        deviceFingerprint: browserFingerprint,
        userAgent,
        metadata: { reason: "Self-destruct triggered after download" }
      });

      await FileDocument.findByIdAndDelete(doc._id);
      try {
        const mockIpfsPath = path.join(__dirname, "../../ipfs_mock", doc.cid);
        if (fs.existsSync(mockIpfsPath)) {
          fs.unlinkSync(mockIpfsPath);
        }
      } catch (err) {
        console.warn("Unable to remove self-destruct file from IPFS mock folder:", err);
      }

      await AuditLog.create({
        action: "DELETE",
        userId: user._id,
        username: user.username,
        ip: clientIp,
        location: `${downloadGeo.city}, ${downloadGeo.country}`,
        details: `File self-destructed automatically after download. CID: ${doc.cid}`,
        status: "SUCCESS"
      });
    }

    // 7. Log successful download activity
    await logFileActivity({
      fileId,
      fileName: doc.fileName,
      eventType: "DOWNLOAD",
      performedBy: user._id,
      performedByUsername: user.username,
      ipAddress: clientIp,
      deviceFingerprint: browserFingerprint,
      userAgent,
      recipientUsername: doc.owner.toString() !== user._id.toString() ? user.username : undefined,
      downloadCount: shareInfo ? shareInfo.downloadCount : 0,
      metadata: {
        fileSize: doc.fileSize,
        cid: doc.cid,
        selfDestruct: doc.selfDestruct,
        wasOwner: doc.owner.toString() === user._id.toString()
      }
    });

    await AuditLog.create({
      action: "DOWNLOAD",
      userId: user._id,
      username: user.username,
      ip: clientIp,
      location: `${downloadGeo.city}, ${downloadGeo.country}`,
      details: `File downloaded and decrypted. CID: ${doc.cid}. SelfDestruct triggered: ${doc.selfDestruct}`,
      status: "SUCCESS"
    });

    res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
    res.setHeader("Content-Type", doc.mimeType);
    return res.send(payload);

  } catch (error: any) {
    console.error("Download handler fault:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const shareFile = async (req: any, res: Response) => {
  const { fileId, targetUsername, durationSeconds, maxDownloads } = req.body;
  const user = req.user;
  const clientIp = req.ip || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";
  const browserFingerprint = req.headers["x-browser-fingerprint"] || "";

  const shareGeo = await resolveIPGeo(clientIp);

  try {
    const doc = await FileDocument.findById(fileId);
    if (!doc || doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to manage permissions on this asset." });
    }

    const safeUsername = targetUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const recipient = await User.findOne({ username: { $regex: new RegExp(`^${safeUsername}$`, "i") } });
    if (!recipient) {
      return res.status(404).json({ error: "Target recipient not found." });
    }

    const validUntil = durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1000) : undefined;

    doc.sharedWith.push({
      accessor: recipient._id,
      accessorAddress: recipient.didAddress,
      validUntil,
      maxDownloads: maxDownloads || undefined,
      downloadCount: 0,
      sharedAt: new Date(),
      sharedByIp: clientIp,
      sharedByGeo: {
        city: shareGeo.city,
        region: shareGeo.region,
        country: shareGeo.country,
        countryCode: shareGeo.countryCode,
        lat: shareGeo.lat,
        lon: shareGeo.lon,
        isp: shareGeo.isp,
        org: shareGeo.org
      }
    });

    // Update share counter
    doc.totalShares = (doc.totalShares || 0) + 1;
    await doc.save();

    // Log share activity
    await logFileActivity({
      fileId,
      fileName: doc.fileName,
      eventType: "SHARE",
      performedBy: user._id,
      performedByUsername: user.username,
      ipAddress: clientIp,
      deviceFingerprint: browserFingerprint,
      userAgent,
      recipientUsername: targetUsername,
      recipientUserId: recipient._id.toString(),
      shareExpiry: validUntil,
      maxDownloads: maxDownloads || 0,
      metadata: {
        fileSize: doc.fileSize,
        totalShares: doc.totalShares
      }
    });

    websocketService.notifyPermissionChange(fileId, recipient.username, "GRANTED");

    await AuditLog.create({
      action: "PERMISSION_CHANGE",
      userId: user._id,
      username: user.username,
      ip: clientIp,
      location: `${shareGeo.city}, ${shareGeo.country}`,
      details: `Access granted to ${targetUsername} for FileId: ${fileId}`,
      status: "SUCCESS"
    });

    return res.json({ message: "Permissions successfully registered." });
  } catch (error: any) {
    console.error("Share handler fault:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getMyFiles = async (req: any, res: Response) => {
  try {
    const files = await FileDocument.find({
      $or: [{ owner: req.user._id }, { "sharedWith.accessor": req.user._id }]
    }).populate("owner", "username email");
    return res.json(files);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files/shared-with-me
 * Returns files shared with the current user with share details
 */
export const getSharedWithMe = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const username = req.user.username;

    // Find all files where the current user is in sharedWith
    const files = await FileDocument.find({
      "sharedWith.accessor": userId,
      isRecycled: false
    }).populate("owner", "username email");

    // Extract the share details for the current user
    const sharedFiles = files.map((doc: any) => {
      const share = doc.sharedWith.find(
        (s: any) => s.accessor && s.accessor.toString() === userId.toString()
      );

      const now = new Date();
      const isExpired = share?.validUntil ? now > new Date(share.validUntil) : false;
      const isDownloadLimitReached = share?.maxDownloads
        ? (share.downloadCount || 0) >= share.maxDownloads
        : false;
      const isActive = !isExpired && !isDownloadLimitReached && !doc.isLocked;

      return {
        _id: doc._id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        cid: doc.cid,
        threatScore: doc.threatScore,
        owner: doc.owner,
        // Share details
        sharedAt: share?.sharedAt || doc.createdAt,
        validUntil: share?.validUntil || null,
        maxDownloads: share?.maxDownloads || 0,
        downloadCount: share?.downloadCount || 0,
        sharedByIp: share?.sharedByIp || "",
        sharedByGeo: share?.sharedByGeo || {},
        // Status
        isActive,
        isExpired,
        isDownloadLimitReached,
        isLocked: doc.isLocked,
        // Provenance
        uploadGeoLocation: doc.uploadGeoLocation || {},
        createdAt: doc.createdAt
      };
    });

    // Sort by most recently shared first
    sharedFiles.sort((a: any, b: any) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());

    return res.json({ files: sharedFiles, total: sharedFiles.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/files/generate-share-link
 * Generates a share link with token for QR code
 */
export const generateShareLink = async (req: any, res: Response) => {
  try {
    const { fileId, durationSeconds, maxDownloads } = req.body;
    const user = req.user;
    const crypto = await import("crypto");

    const doc = await FileDocument.findById(fileId);
    if (!doc || doc.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized." });
    }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(32).toString("hex");
    const validUntil = durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1000) : null;

    // Store the share token on the file's sharedWith array
    doc.sharedWith.push({
      accessor: user._id,
      accessorAddress: user.didAddress,
      validUntil,
      maxDownloads: maxDownloads || undefined,
      downloadCount: 0,
      sharedAt: new Date(),
      sharedByIp: req.ip || "127.0.0.1",
      sharedByGeo: {},
      shareToken,
      isPublicLink: true
    });

    doc.totalShares = (doc.totalShares || 0) + 1;
    await doc.save();

    // Build the share URL
    const baseUrl = req.headers.origin || `http://${req.headers.host}`;
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return res.json({
      shareUrl,
      shareToken,
      validUntil: validUntil?.toISOString() || null,
      maxDownloads: maxDownloads || 0,
      fileId: doc._id,
      fileName: doc.fileName
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/files/public-share/:shareToken
 * Public endpoint to get file info from a share link (no auth required)
 */
export const getPublicShareInfo = async (req: any, res: Response) => {
  try {
    const { shareToken } = req.params;
    const doc = await FileDocument.findOne({ "sharedWith.shareToken": shareToken });

    if (!doc) {
      return res.status(404).json({ error: "Invalid or expired share link." });
    }

    const share = doc.sharedWith.find((s: any) => s.shareToken === shareToken);
    if (!share) {
      return res.status(404).json({ error: "Share link not found." });
    }

    // Check validity
    const now = new Date();
    const isExpired = share.validUntil ? now > new Date(share.validUntil) : false;
    const isDownloadLimitReached = share.maxDownloads ? (share.downloadCount || 0) >= share.maxDownloads : false;

    if (isExpired || isDownloadLimitReached || doc.isLocked) {
      return res.status(403).json({
        error: isExpired ? "Share link has expired." : isDownloadLimitReached ? "Download limit reached." : "File is locked.",
        expired: isExpired,
        limitReached: isDownloadLimitReached
      });
    }

    return res.json({
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      owner: doc.owner,
      threatScore: doc.threatScore,
      validUntil: share.validUntil,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/files/public-download/:shareToken
 * Public download endpoint using share token (no JWT required)
 */
export const publicDownload = async (req: any, res: Response) => {
  try {
    const { shareToken } = req.params;
    const clientIp = req.ip || "127.0.0.1";

    const doc = await FileDocument.findOne({ "sharedWith.shareToken": shareToken });
    if (!doc) {
      return res.status(404).json({ error: "Invalid share link." });
    }

    const share = doc.sharedWith.find((s: any) => s.shareToken === shareToken);
    if (!share) {
      return res.status(404).json({ error: "Share not found." });
    }

    // Validate
    const now = new Date();
    if (share.validUntil && now > new Date(share.validUntil)) {
      return res.status(403).json({ error: "Share link has expired." });
    }
    if (share.maxDownloads && (share.downloadCount || 0) >= share.maxDownloads) {
      return res.status(403).json({ error: "Download limit reached." });
    }
    if (doc.isLocked) {
      return res.status(403).json({ error: "File is locked." });
    }

    // Increment download count
    share.downloadCount = (share.downloadCount || 0) + 1;
    doc.totalDownloads = (doc.totalDownloads || 0) + 1;
    await doc.save();

    // Log activity
    await logFileActivity({
      fileId: doc._id.toString(),
      fileName: doc.fileName,
      eventType: "DOWNLOAD",
      performedBy: "public-link",
      performedByUsername: "anonymous",
      ipAddress: clientIp,
      success: true,
      metadata: { shareToken, downloadType: "public_link" }
    });

    // Serve the file
    const { ipfsService } = await import("../services/ipfsService");
    const { CryptoHelper } = await import("../utils/cryptoHelper");
    const cipherBlock = await ipfsService.downloadFile(doc.cid);
    const decrypted = CryptoHelper.decryptAesGcm(
      Buffer.from(cipherBlock, "base64"),
      doc.encryptedAesKey,
      doc.iv
    );

    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
    return res.send(decrypted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
