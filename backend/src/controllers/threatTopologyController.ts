import { Response } from "express";
import { ThreatIntelligence } from "../models/ThreatIntelligence";
import { generateThreatBatch, generateLiveThreat, getActiveThreats, getThreatStats } from "../services/threatSimulationService";

/**
 * POST /api/threats/generate
 * Generate a batch of simulated threat events
 */
export const generateThreats = async (req: any, res: Response) => {
  try {
    const count = Math.min(parseInt(req.body.count) || 10, 50);
    const events = await generateThreatBatch(count);
    return res.json({ message: `Generated ${events.length} threat events`, events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/threats/active
 * Get active threats for the topology map
 */
export const getActiveThreatEvents = async (req: any, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const threats = await getActiveThreats(limit);
    return res.json(threats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/threats/stats
 * Get threat statistics for the dashboard
 */
export const getThreatStatistics = async (req: any, res: Response) => {
  try {
    const stats = await getThreatStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/threats/simulate-live
 * Generate and broadcast a single live threat event
 */
export const simulateLiveThreat = async (req: any, res: Response) => {
  try {
    const event = await generateLiveThreat();
    return res.json({ message: "Live threat simulated", event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/threats/timeline
 * Get threat events over time
 */
export const getThreatTimeline = async (req: any, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 3600000);
    const events = await ThreatIntelligence.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(events);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
