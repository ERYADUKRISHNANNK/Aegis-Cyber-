import { ThreatIntelligence } from "../models/ThreatIntelligence";
import { websocketService } from "./websocketService";

// Known attack source hotspots (lat, lon, country, city, countryCode)
const ATTACK_SOURCES = [
  { lat: 39.9, lon: 116.4, country: "China", countryCode: "CN", city: "Beijing" },
  { lat: 55.75, lon: 37.62, country: "Russia", countryCode: "RU", city: "Moscow" },
  { lat: 35.68, lon: 139.69, country: "Japan", countryCode: "JP", city: "Tokyo" },
  { lat: 37.57, lon: 126.98, country: "South Korea", countryCode: "KR", city: "Seoul" },
  { lat: 33.69, lon: 73.04, country: "Pakistan", countryCode: "PK", city: "Islamabad" },
  { lat: 28.61, lon: 77.21, country: "India", countryCode: "IN", city: "New Delhi" },
  { lat: 52.52, lon: 13.41, country: "Germany", countryCode: "DE", city: "Berlin" },
  { lat: 48.86, lon: 2.35, country: "France", countryCode: "FR", city: "Paris" },
  { lat: 40.71, lon: -74.01, country: "USA", countryCode: "US", city: "New York" },
  { lat: 34.05, lon: -118.24, country: "USA", countryCode: "US", city: "Los Angeles" },
  { lat: 51.51, lon: -0.13, country: "UK", countryCode: "GB", city: "London" },
  { lat: -33.87, lon: 151.21, country: "Australia", countryCode: "AU", city: "Sydney" },
  { lat: 1.35, lon: 103.82, country: "Singapore", countryCode: "SG", city: "Singapore" },
  { lat: 25.28, lon: 51.53, country: "Qatar", countryCode: "QA", city: "Doha" },
  { lat: 24.47, lon: 54.37, country: "UAE", countryCode: "AE", city: "Abu Dhabi" },
  { lat: 30.04, lon: 31.24, country: "Egypt", countryCode: "EG", city: "Cairo" },
  { lat: -23.55, lon: -46.63, country: "Brazil", countryCode: "BR", city: "Sao Paulo" },
  { lat: 19.43, lon: -99.13, country: "Mexico", countryCode: "MX", city: "Mexico City" },
  { lat: 39.92, lon: 32.85, country: "Turkey", countryCode: "TR", city: "Ankara" },
  { lat: 35.76, lon: 51.39, country: "Iran", countryCode: "IR", city: "Tehran" },
  { lat: 47.61, lon: -122.33, country: "USA", countryCode: "US", city: "Seattle" },
  { lat: 22.32, lon: 114.17, country: "Hong Kong", countryCode: "HK", city: "Hong Kong" },
  { lat: 35.18, lon: 33.38, country: "Cyprus", countryCode: "CY", city: "Nicosia" },
  { lat: 41.01, lon: 28.98, country: "Turkey", countryCode: "TR", city: "Istanbul" }
];

const TARGET_HOTSPOTS = [
  { lat: 37.77, lon: -122.42, country: "USA", countryCode: "US", city: "San Francisco" },
  { lat: 40.71, lon: -74.01, country: "USA", countryCode: "US", city: "New York" },
  { lat: 51.51, lon: -0.13, country: "UK", countryCode: "GB", city: "London" },
  { lat: 48.86, lon: 2.35, country: "France", countryCode: "FR", city: "Paris" },
  { lat: 52.52, lon: 13.41, country: "Germany", countryCode: "DE", city: "Berlin" },
  { lat: 35.68, lon: 139.69, country: "Japan", countryCode: "JP", city: "Tokyo" },
  { lat: 1.35, lon: 103.82, country: "Singapore", countryCode: "SG", city: "Singapore" },
  { lat: 22.32, lon: 114.17, country: "Hong Kong", countryCode: "HK", city: "Hong Kong" },
  { lat: -33.87, lon: 151.21, country: "Australia", countryCode: "AU", city: "Sydney" },
  { lat: 28.61, lon: 77.21, country: "India", countryCode: "IN", city: "New Delhi" }
];

const THREAT_TYPES = [
  { eventType: "DDoS", severity: "HIGH", score: 72, tactic: "TA0040", technique: "T1498", desc: "Volumetric DDoS attack targeting infrastructure" },
  { eventType: "Ransomware", severity: "CRITICAL", score: 95, tactic: "TA0040", technique: "T1486", desc: "Ransomware deployment with data encryption" },
  { eventType: "Phishing", severity: "MEDIUM", score: 55, tactic: "TA0001", technique: "T1566", desc: "Spear phishing campaign targeting credentials" },
  { eventType: "DataExfil", severity: "CRITICAL", score: 90, tactic: "TA0010", technique: "T1041", desc: "Data exfiltration via encrypted channels" },
  { eventType: "BruteForce", severity: "MEDIUM", score: 45, tactic: "TA0006", technique: "T1110", desc: "Credential brute force attack" },
  { eventType: "ZeroDay", severity: "CRITICAL", score: 98, tactic: "TA0001", technique: "T1190", desc: "Zero-day exploit against unknown vulnerability" },
  { eventType: "SupplyChain", severity: "HIGH", score: 85, tactic: "TA0001", technique: "T1195", desc: "Supply chain compromise detected" },
  { eventType: "Insider", severity: "HIGH", score: 78, tactic: "TA0005", technique: "T1078", desc: "Insider threat - unauthorized data access" }
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Generate a batch of simulated threat events
 */
export const generateThreatBatch = async (count: number = 5): Promise<any[]> => {
  const events: any[] = [];

  for (let i = 0; i < count; i++) {
    const source = pick(ATTACK_SOURCES);
    const target = pick(TARGET_HOTSPOTS);
    const threat = pick(THREAT_TYPES);

    // Add some randomness to coordinates
    const srcLat = source.lat + rand(-2, 2);
    const srcLon = source.lon + rand(-2, 2);
    const tgtLat = target.lat + rand(-1, 1);
    const tgtLon = target.lon + rand(-1, 1);

    const event = await ThreatIntelligence.create({
      eventType: threat.eventType,
      severity: threat.severity,
      sourceIp: `${Math.floor(rand(1, 223))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(1, 254))}`,
      sourceGeo: { city: source.city, country: source.country, countryCode: source.countryCode, lat: srcLat, lon: srcLon },
      targetIp: `${Math.floor(rand(1, 223))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(1, 254))}`,
      targetGeo: { city: target.city, country: target.country, countryCode: target.countryCode, lat: tgtLat, lon: tgtLon },
      threatScore: Math.min(100, Math.max(0, threat.score + Math.floor(rand(-10, 10)))),
      confidence: Math.floor(rand(60, 99)),
      mitreTactic: threat.tactic,
      mitreTechnique: threat.technique,
      description: threat.desc,
      isActive: Math.random() > 0.15, // 85% chance active
      tags: [threat.eventType.toLowerCase(), source.countryCode.toLowerCase(), target.countryCode.toLowerCase()]
    });

    events.push(event);
  }

  return events;
};

/**
 * Generate a single threat event and broadcast via WebSocket
 */
export const generateLiveThreat = async (): Promise<any> => {
  const events = await generateThreatBatch(1);
  if (events.length > 0) {
    const event = events[0];
    websocketService.broadcast({
      type: "THREAT_TOPOLOGY_EVENT",
      payload: {
        id: event._id,
        eventType: event.eventType,
        severity: event.severity,
        source: event.sourceGeo,
        target: event.targetGeo,
        threatScore: event.threatScore,
        description: event.description,
        timestamp: new Date().toISOString()
      }
    });
    return event;
  }
  return null;
};

/**
 * Get current active threats for the topology map
 */
export const getActiveThreats = async (limit: number = 50): Promise<any[]> => {
  return await ThreatIntelligence.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Get threat statistics for the topology dashboard
 */
export const getThreatStats = async (): Promise<any> => {
  const totalActive = await ThreatIntelligence.countDocuments({ isActive: true });
  const totalAll = await ThreatIntelligence.countDocuments({});

  const byType = await ThreatIntelligence.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$eventType", count: { $sum: 1 }, avgScore: { $avg: "$threatScore" } } }
  ]);

  const bySeverity = await ThreatIntelligence.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$severity", count: { $sum: 1 } } }
  ]);

  const byCountry = await ThreatIntelligence.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$sourceGeo.countryCode", count: { $sum: 1 }, country: { $first: "$sourceGeo.country" }, lat: { $first: "$sourceGeo.lat" }, lon: { $first: "$sourceGeo.lon" } } }
  ]);

  return { totalActive, totalAll, byType, bySeverity, byCountry };
};
