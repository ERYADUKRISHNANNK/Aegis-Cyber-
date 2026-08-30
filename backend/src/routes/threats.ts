import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { zeroTrustGuard } from "../middleware/zeroTrustGuard";
import { generateThreats, getActiveThreatEvents, getThreatStatistics, simulateLiveThreat, getThreatTimeline } from "../controllers/threatTopologyController";
import { runFullAnalysis, runSpecificAgent, getSwarmStatus } from "../controllers/agentSwarmController";
import { getForecast, getWeather } from "../controllers/threatOracleController";

const router = Router();

// === Threat Topology Map ===
router.post("/generate", authenticateJWT, zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]), generateThreats);
router.get("/active", authenticateJWT, zeroTrustGuard(), getActiveThreatEvents);
router.get("/stats", authenticateJWT, zeroTrustGuard(), getThreatStatistics);
router.post("/simulate-live", authenticateJWT, zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]), simulateLiveThreat);
router.get("/timeline", authenticateJWT, zeroTrustGuard(), getThreatTimeline);

// === AI Agent Swarm ===
router.post("/swarm/analyze", authenticateJWT, zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]), runFullAnalysis);
router.post("/swarm/agent/:name", authenticateJWT, zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]), runSpecificAgent);
router.get("/swarm/status", authenticateJWT, zeroTrustGuard(), getSwarmStatus);

// === Predictive Threat Oracle ===
router.get("/oracle/forecast", authenticateJWT, zeroTrustGuard(["Super Admin", "Admin", "SOC Analyst"]), getForecast);
router.get("/oracle/weather", authenticateJWT, zeroTrustGuard(), getWeather);

export default router;
