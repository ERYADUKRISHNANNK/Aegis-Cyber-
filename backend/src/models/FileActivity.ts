import { Schema, model } from "mongoose";
import { isDbOffline } from "../config/db";

const GeoLocationSchema = new Schema(
  {
    city: { type: String, default: "Unknown" },
    region: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    countryCode: { type: String, default: "XX" },
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    isp: { type: String, default: "Unknown" },
    org: { type: String, default: "Unknown" }
  },
  { _id: false }
);

const FileActivitySchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, ref: "FileDocument", required: true, index: true },
    fileName: { type: String, required: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        "UPLOAD",
        "DOWNLOAD",
        "SHARE",
        "ACCESS_CHECK",
        "DELETE",
        "EXPIRY",
        "SELF_DESTRUCT",
        "VERSION_CREATE",
        "EMERGENCY_LOCK",
        "UNLOCK"
      ],
      index: true
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByUsername: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String, default: "" },
    geoLocation: { type: GeoLocationSchema, default: () => ({}) },
    deviceFingerprint: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    // Share-specific fields
    recipientUsername: { type: String, default: "" },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    shareExpiry: { type: Date, default: null },
    maxDownloads: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    // Result fields
    success: { type: Boolean, default: true },
    failureReason: { type: String, default: "" },
    // Blockchain reference
    blockchainTxHash: { type: String, default: "" },
    // Flexible metadata
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Compound indexes for efficient querying
FileActivitySchema.index({ fileId: 1, timestamp: -1 });
FileActivitySchema.index({ performedBy: 1, timestamp: -1 });
FileActivitySchema.index({ eventType: 1, timestamp: -1 });
FileActivitySchema.index({ "geoLocation.country": 1 });

const MongooseFileActivity = model("FileActivity", FileActivitySchema);

// Inline mock for offline mode - delegates to dbMock
export const FileActivity = new Proxy(MongooseFileActivity, {
  get(target, prop) {
    if (isDbOffline) {
      // Lazy-load the mock to avoid circular deps
      const { MockFileActivity } = require("./dbMock");
      return (MockFileActivity as any)[prop];
    }
    return (target as any)[prop];
  }
}) as any;
