import { Response } from "express";
import { agentSwarm } from "../services/agentSwarmService";

/**
 * POST /api/swarm/analyze
 * Run full swarm analysis (all agents in parallel)
 */
export const runFullAnalysis = async (req: any, res: Response) => {
  try {
    const context = req.body || {};
    const report = await agentSwarm.runFullAnalysis(context);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/swarm/agent/:name
 * Run a specific agent
 */
export const runSpecificAgent = async (req: any, res: Response) => {
  try {
    const { name } = req.params;
    const context = req.body || {};
    const result = await agentSwarm.runAgent(name, context);
    if (!result) {
      return res.status(404).json({ error: `Agent '${name}' not found` });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/swarm/status
 * Get swarm status
 */
export const getSwarmStatus = async (req: any, res: Response) => {
  try {
    const status = agentSwarm.getStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
