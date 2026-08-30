import { Schema, model } from "mongoose";
import { isDbOffline } from "../config/db";

const ThreatEventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ["DDoS", "Ransomware", "Phishing", "DataExfil", "BruteForce", "ZeroDay", "SupplyChain", "Insider"],
      index: true
    },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    sourceIp: { type: String, required: true },
    sourceGeo: {
      city: { type: String, default: "Unknown" },
      country: { type: String, default: "Unknown" },
      countryCode: { type: String, default: "XX" },
      lat: { type: Number, default: 0 },
      lon: { type: Number, default: 0 }
    },
    targetIp: { type: String, default: "" },
    targetGeo: {
      city: { type: String, default: "Unknown" },
      country: { type: String, default: "Unknown" },
      countryCode: { type: String, default: "XX" },
      lat: { type: Number, default: 0 },
      lon: { type: Number, default: 0 }
    },
    threatScore: { type: Number, default: 0, min: 0, max: 100 },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    mitreTactic: { type: String, default: "" },
    mitreTechnique: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    mitigatedAt: { type: Date, default: null },
    predictedBy: { type: String, default: "" }, // Which agent predicted it
    tags: [{ type: String }]
  },
  { timestamps: true }
);

ThreatEventSchema.index({ createdAt: -1 });
ThreatEventSchema.index({ severity: 1, isActive: 1 });
ThreatEventSchema.index({ "sourceGeo.countryCode": 1 });

const MongooseThreat = model("ThreatIntelligence", ThreatEventSchema);

// Inline mock
const threatsFile = require("path").join(__dirname, "../../mock_db_threat_intel.json");

const loadData = (): any[] => {
  try {
    const fs = require("fs");
    if (fs.existsSync(threatsFile)) return JSON.parse(fs.readFileSync(threatsFile, "utf8"));
  } catch {}
  return [];
};

const saveData = (data: any[]) => {
  try { require("fs").writeFileSync(threatsFile, JSON.stringify(data, null, 2), "utf8"); } catch {}
};

class MockThreatIntelligence {
  static async create(data: any) {
    const list = loadData();
    const event = { ...data, _id: new (require("mongoose").Types.ObjectId)().toString(), createdAt: new Date(), updatedAt: new Date() };
    list.push(event);
    saveData(list);
    return event;
  }

  static find(query: any = {}) {
    let filtered = [...loadData()];
    if (query.isActive !== undefined) filtered = filtered.filter(e => e.isActive === query.isActive);
    if (query.severity) filtered = filtered.filter(e => e.severity === query.severity);
    if (query.eventType) filtered = filtered.filter(e => e.eventType === query.eventType);
    if (query.$and) {
      for (const c of query.$and) {
        if (c.createdAt && c.createdAt.$gte) filtered = filtered.filter(e => new Date(e.createdAt) >= new Date(c.createdAt.$gte));
        if (c.createdAt && c.createdAt.$lte) filtered = filtered.filter(e => new Date(e.createdAt) <= new Date(c.createdAt.$lte));
      }
    }

    let current = [...filtered];
    const q: any = {
      sort: (o: any) => { const k = Object.keys(o)[0]; current.sort((a: any, b: any) => o[k] * (new Date(a[k]).getTime() - new Date(b[k]).getTime())); return ref; },
      limit: (n: number) => { current = current.slice(0, n); return ref; },
      populate: () => ref
    };
    let ref: any = Object.create(q);
    ref.then = (r: any, e: any) => Promise.resolve([...current]).then(r, e);
    ref.catch = (h: any) => Promise.resolve([...current]).catch(h);
    return ref;
  }

  static async countDocuments(query: any = {}) {
    let filtered = [...loadData()];
    if (query.isActive !== undefined) filtered = filtered.filter(e => e.isActive === query.isActive);
    if (query.severity) filtered = filtered.filter(e => e.severity === query.severity);
    return filtered.length;
  }

  static async aggregate(pipeline: any[]) {
    let result: any[] = loadData();
    for (const stage of pipeline) {
      if (stage.$match) {
        if (stage.$match.isActive !== undefined) result = result.filter(e => e.isActive === stage.$match.isActive);
        if (stage.$match.eventType) result = result.filter(e => e.eventType === stage.$match.eventType);
        if (stage.$match.severity) result = result.filter(e => e.severity === stage.$match.severity);
      }
      if (stage.$group) {
        const g = stage.$group;
        if (g._id === "$eventType") {
          const groups: Record<string, any[]> = {};
          result.forEach(i => { const k = i.eventType || "?"; (groups[k] = groups[k] || []).push(i); });
          result = Object.entries(groups).map(([k, v]) => ({ _id: k, count: v.length, avgScore: Math.round(v.reduce((s: number, i: any) => s + (i.threatScore || 0), 0) / v.length) }));
        } else if (g._id === "$severity") {
          const groups: Record<string, any[]> = {};
          result.forEach(i => { const k = i.severity || "?"; (groups[k] = groups[k] || []).push(i); });
          result = Object.entries(groups).map(([k, v]) => ({ _id: k, count: v.length }));
        } else if (g._id === "$sourceGeo.countryCode") {
          const groups: Record<string, any[]> = {};
          result.forEach(i => { const k = i.sourceGeo?.countryCode || "??"; (groups[k] = groups[k] || []).push(i); });
          result = Object.entries(groups).map(([k, v]) => ({ _id: k, count: v.length, country: v[0]?.sourceGeo?.country, lat: v[0]?.sourceGeo?.lat, lon: v[0]?.sourceGeo?.lon }));
        } else if (g._id && typeof g._id === "string" && g._id.startsWith("$")) {
          const field = g._id.replace("$", "");
          const groups: Record<string, any[]> = {};
          result.forEach(i => { const k = String(field.includes(".") ? field.split(".").reduce((o: any, k: string) => o?.[k], i) : i[field] || "?"); (groups[k] = groups[k] || []).push(i); });
          result = Object.entries(groups).map(([k, v]) => ({ _id: k, count: v.length }));
        } else {
          result = [{ _id: "all", count: result.length }];
        }
      }
      if (stage.$sort) { const k = Object.keys(stage.$sort)[0]; result.sort((a: any, b: any) => stage.$sort[k] * ((a[k] > b[k] ? 1 : -1))); }
      if (stage.$limit) result = result.slice(0, stage.$limit);
    }
    return result;
  }
}

export const ThreatIntelligence = new Proxy(MongooseThreat, {
  get(target, prop) {
    if (isDbOffline) return (MockThreatIntelligence as any)[prop];
    return (target as any)[prop];
  }
}) as any;
