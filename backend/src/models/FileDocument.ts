import { Schema, model } from "mongoose";
import { isDbOffline } from "../config/db";
import { MockFileDocument } from "./dbMock";

const FileDocumentSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    cid: { type: String, required: true, unique: true },
    fileHash: { type: String, required: true, unique: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerAddress: { type: String, required: true },
    threatScore: { type: Number, default: 0 },
    encryptedAesKey: { type: String, required: true },
    iv: { type: String, required: true },
    digitalSignature: { type: String, required: true },
    blockchainTxHash: { type: String, default: "" },
    isLocked: { type: Boolean, default: false },
    isRecycled: { type: Boolean, default: false },
    selfDestruct: { type: Boolean, default: false },
    sharedWith: [
      {
        accessor: { type: Schema.Types.ObjectId, ref: "User" },
        accessorAddress: String,
        validUntil: Date,
        maxDownloads: Number,
        downloadCount: { type: Number, default: 0 },
        sharedAt: { type: Date, default: Date.now },
        sharedByIp: { type: String, default: "" },
        sharedByGeo: { type: Schema.Types.Mixed, default: {} }
      }
    ],
    // === PROVENANCE TRACKING FIELDS ===
    uploadIpAddress: { type: String, default: "" },
    uploadGeoLocation: { type: Schema.Types.Mixed, default: {} },
    uploadDeviceFingerprint: { type: String, default: "" },
    uploadUserAgent: { type: String, default: "" },
    // Activity counters
    totalDownloads: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    uniqueViewerIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    uniqueViewerCount: { type: Number, default: 0 },
    // Last access
    lastAccessedAt: { type: Date, default: null },
    lastAccessedBy: { type: String, default: "" },
    lastAccessedByIp: { type: String, default: "" },
    lastAccessedByGeo: { type: Schema.Types.Mixed, default: {} },
    // Versioning
    versionNumber: { type: Number, default: 1 },
    parentFileId: { type: Schema.Types.ObjectId, ref: "FileDocument", default: null }
  },
  { timestamps: true }
);

const MongooseFile = model("FileDocument", FileDocumentSchema);

export const FileDocument = new Proxy(MongooseFile, {
  get(target, prop) {
    if (isDbOffline) {
      return (MockFileDocument as any)[prop];
    }
    return (target as any)[prop];
  }
}) as any;
