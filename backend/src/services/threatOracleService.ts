import { ThreatIntelligence } from "../models/ThreatIntelligence";
import { FileActivity } from "../models/FileActivity";
import { AuditLog } from "../models/AuditLog";

interface ThreatPrediction {
  id: string;
  predictedAt: Date;
  predictedFor: Date;
  hoursAhead: number;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  threatScore: number;
  likelySourceRegions: string[];
  likelyTargets: string[];
  description: string;
  mitigationSteps: string[];
  historicalPattern: string;
  riskFactors: string[];
}

interface ForecastDashboard {
  generatedAt: string;
  forecastHorizon: string;
  predictions: ThreatPrediction[];
  overallRiskScore: number;
  riskTrend: "INCREASING" | "STABLE" | "DECREASING";
  threatWeather: ThreatWeather;
  timeSeriesData: TimeSeriesPoint[];
  recommendations: string[];
}

interface ThreatWeather {
  condition: string;
  severity: string;
  description: string;
  icon: string;
  outlook24h: string;
  outlook48h: string;
  outlook72h: string;
}

interface TimeSeriesPoint {
  hour: string;
  actual: number;
  predicted: number;
  upper: number;
  lower: number;
}

// Historical threat pattern templates
const THREAT_PATTERNS = [
  {
    eventType: "Ransomware",
    baseFrequency: 0.12,
    peakHours: [9, 10, 14, 15],
    weekendMultiplier: 0.6,
    geoBias: ["CN", "RU", "KP"],
    seasonality: "quarterly",
    description: "Ransomware campaigns typically peak during business hours in target timezones"
  },
  {
    eventType: "DDoS",
    baseFrequency: 0.25,
    peakHours: [0, 1, 2, 3, 22, 23],
    weekendMultiplier: 1.4,
    geoBias: ["RU", "CN", "BR"],
    seasonality: "continuous",
    description: "DDoS attacks show higher frequency during off-hours and weekends"
  },
  {
    eventType: "Phishing",
    baseFrequency: 0.18,
    peakHours: [8, 9, 10, 11, 13, 14],
    weekendMultiplier: 0.4,
    geoBias: ["NG", "PH", "IN"],
    seasonality: "monthly",
    description: "Phishing campaigns align with business hours for maximum click-through"
  },
  {
    eventType: "DataExfil",
    baseFrequency: 0.08,
    peakHours: [1, 2, 3, 4],
    weekendMultiplier: 1.8,
    geoBias: ["CN", "RU", "IR"],
    seasonality: "irregular",
    description: "Data exfiltration peaks during off-hours when monitoring is reduced"
  },
  {
    eventType: "BruteForce",
    baseFrequency: 0.30,
    peakHours: [0, 1, 2, 3, 4, 5],
    weekendMultiplier: 1.2,
    geoBias: ["RU", "CN", "BR", "IN"],
    seasonality: "continuous",
    description: "Brute force attacks are persistent but intensify during low-monitoring periods"
  },
  {
    eventType: "ZeroDay",
    baseFrequency: 0.02,
    peakHours: [10, 11, 14, 15, 16],
    weekendMultiplier: 0.8,
    geoBias: ["CN", "RU", "US", "IL"],
    seasonality: "rare",
    description: "Zero-day exploits are rare but devastating, often tied to geopolitical events"
  },
  {
    eventType: "SupplyChain",
    baseFrequency: 0.04,
    peakHours: [9, 10, 11],
    weekendMultiplier: 0.3,
    geoBias: ["CN", "RU"],
    seasonality: "quarterly",
    description: "Supply chain attacks target development and deployment pipelines"
  },
  {
    eventType: "Insider",
    baseFrequency: 0.06,
    peakHours: [17, 18, 19, 20],
    weekendMultiplier: 0.5,
    geoBias: ["US", "GB", "DE"],
    seasonality: "monthly",
    description: "Insider threats often occur near end-of-day when oversight decreases"
  }
];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Generate time-series forecast data for the next 72 hours
 */
const generateTimeSeries = (pattern: any, hoursAhead: number = 72): TimeSeriesPoint[] => {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();

  for (let h = 0; h < hoursAhead; h++) {
    const futureTime = new Date(now.getTime() + h * 3600000);
    const hourOfDay = futureTime.getHours();
    const dayOfWeek = futureTime.getDay();

    // Base rate
    let rate = pattern.baseFrequency * 100;

    // Hour-of-day factor (Gaussian around peak hours)
    const hourFactor = pattern.peakHours.reduce((sum: number, peak: number) => {
      const dist = Math.abs(hourOfDay - peak);
      return sum + Math.exp(-(dist * dist) / 8);
    }, 0) / pattern.peakHours.length;
    rate *= (0.5 + hourFactor);

    // Weekend factor
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      rate *= pattern.weekendMultiplier;
    }

    // Add noise
    const noise = rand(-10, 10);
    const predicted = Math.max(0, Math.round(rate + noise));
    const upper = Math.round(predicted * 1.3);
    const lower = Math.max(0, Math.round(predicted * 0.7));

    points.push({
      hour: futureTime.toISOString(),
      actual: 0, // future - no actual yet
      predicted,
      upper,
      lower
    });
  }

  return points;
};

/**
 * Calculate overall threat weather
 */
const calculateThreatWeather = (predictions: ThreatPrediction[], recentThreats: any[]): ThreatWeather => {
  const criticalCount = predictions.filter(p => p.severity === "CRITICAL").length;
  const highCount = predictions.filter(p => p.severity === "HIGH").length;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / (predictions.length || 1);

  let condition: string, severity: string, icon: string, description: string;

  if (criticalCount > 2) {
    condition = "SEVERE STORM";
    severity = "CRITICAL";
    icon = "⛈️";
    description = "Multiple critical threats predicted. Maximum alert posture recommended.";
  } else if (criticalCount > 0 || highCount > 3) {
    condition = "STORM WARNING";
    severity = "HIGH";
    icon = "🌧️";
    description = "Elevated threat activity expected. Enhanced monitoring advised.";
  } else if (highCount > 0) {
    condition = "OVERCAST";
    severity = "MEDIUM";
    icon = "☁️";
    description = "Moderate threat activity. Standard defenses should be sufficient.";
  } else if (recentThreats.length > 5) {
    condition = "PARTLY CLOUDY";
    severity = "LOW";
    icon = "⛅";
    description = "Some threat activity detected but within normal parameters.";
  } else {
    condition = "CLEAR SKIES";
    severity = "LOW";
    icon = "☀️";
    description = "Low threat activity. Systems operating normally.";
  }

  return {
    condition,
    severity,
    icon,
    description,
    outlook24h: criticalCount > 0 ? "Threats expected to intensify" : "Stable conditions expected",
    outlook48h: highCount > 2 ? "Elevated activity likely" : "Gradual normalization",
    outlook72h: "Long-term outlook: monitoring ongoing"
  };
};

/**
 * Generate the full threat forecast
 */
export const generateForecast = async (): Promise<ForecastDashboard> => {
  // Get recent historical data
  const recentThreats = await ThreatIntelligence.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(100);

  // Analyze recent patterns
  const recentActivities = await FileActivity.find()
    .sort({ timestamp: -1 })
    .limit(200);

  const recentAuditLogs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(200);

  // Generate predictions for each threat pattern
  const predictions: ThreatPrediction[] = [];
  let overallRisk = 0;

  for (const pattern of THREAT_PATTERNS) {
    // Count recent occurrences of this type
    const recentCount = recentThreats.filter((t: any) => t.eventType === pattern.eventType).length;
    
    // Calculate predicted frequency based on historical + current trends
    const trendFactor = recentCount > 5 ? 1.5 : recentCount > 2 ? 1.2 : 1.0;
    const predictedScore = Math.min(100, Math.round(pattern.baseFrequency * 100 * trendFactor * rand(0.8, 1.2)));

    // Determine severity
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (predictedScore > 80) severity = "CRITICAL";
    else if (predictedScore > 60) severity = "HIGH";
    else if (predictedScore > 40) severity = "MEDIUM";

    // Confidence based on data availability
    const confidence = Math.min(95, 50 + (recentCount * 5) + Math.floor(rand(0, 15)));

    // Risk factors
    const riskFactors: string[] = [];
    const now = new Date();
    if (pattern.peakHours.includes(now.getHours())) riskFactors.push("Current hour is in peak attack window");
    if ([0, 6].includes(now.getDay())) riskFactors.push("Weekend - reduced monitoring");
    if (recentCount > 3) riskFactors.push(`Elevated recent activity: ${recentCount} events in past period`);
    if (pattern.seasonality === "quarterly" && now.getMonth() % 3 === 2) riskFactors.push("Quarterly threat cycle peak");

    // Mitigation steps
    const mitigations: Record<string, string[]> = {
      Ransomware: ["Ensure offline backups are current", "Verify EDR agent coverage", "Review file integrity monitoring"],
      DDoS: ["Verify CDN rate limiting is active", "Check auto-scaling configuration", "Review geo-blocking rules"],
      Phishing: ["Send security awareness reminder", "Verify email gateway filters", "Check DMARC/DKIM/SPF records"],
      DataExfil: ["Review DLP policies", "Check outbound traffic anomalies", "Verify encryption for all transfers"],
      BruteForce: ["Enable account lockout policies", "Review MFA enrollment", "Check rate limiting on auth endpoints"],
      ZeroDay: ["Apply latest security patches", "Review virtual patching rules", "Verify IPS signatures updated"],
      SupplyChain: ["Audit third-party dependencies", "Review CI/CD pipeline security", "Verify code signing certificates"],
      Insider: ["Review privileged access logs", "Verify data access policies", "Check USB/device control policies"]
    };

    const prediction: ThreatPrediction = {
      id: `pred_${pattern.eventType.toLowerCase()}_${Date.now()}`,
      predictedAt: new Date(),
      predictedFor: new Date(Date.now() + 24 * 3600000),
      hoursAhead: 24,
      eventType: pattern.eventType,
      severity,
      confidence,
      threatScore: predictedScore,
      likelySourceRegions: pattern.geoBias,
      likelyTargets: ["US", "GB", "DE", "JP", "AU"],
      description: pattern.description,
      mitigationSteps: mitigations[pattern.eventType] || ["Monitor and assess"],
      historicalPattern: `${recentCount} events in recent period, ${pattern.seasonality} seasonality`,
      riskFactors
    };

    predictions.push(prediction);
    overallRisk += predictedScore;
  }

  overallRisk = Math.round(overallRisk / predictions.length);

  // Risk trend
  const veryRecent = recentThreats.filter((t: any) => new Date(t.createdAt).getTime() > Date.now() - 3600000).length;
  const slightlyOlder = recentThreats.filter((t: any) => {
    const time = new Date(t.createdAt).getTime();
    return time > Date.now() - 7200000 && time <= Date.now() - 3600000;
  }).length;
  const riskTrend = veryRecent > slightlyOlder ? "INCREASING" : veryRecent < slightlyOlder ? "DECREASING" : "STABLE";

  // Generate time series for top threat
  const topThreat = predictions.sort((a, b) => b.threatScore - a.threatScore)[0];
  const topPattern = THREAT_PATTERNS.find(p => p.eventType === topThreat.eventType) || THREAT_PATTERNS[0];
  const timeSeriesData = generateTimeSeries(topPattern);

  // Threat weather
  const threatWeather = calculateThreatWeather(predictions, recentThreats);

  // Global recommendations
  const recommendations: string[] = [
    "Review and update incident response playbooks",
    "Verify all security controls are operational",
    "Ensure threat intelligence feeds are current",
    "Conduct team briefing on predicted threat landscape"
  ];
  if (overallRisk > 70) {
    recommendations.unshift("⚠️ ELEVATED RISK: Consider activating enhanced monitoring");
  }

  return {
    generatedAt: new Date().toISOString(),
    forecastHorizon: "72 hours",
    predictions: predictions.sort((a, b) => b.threatScore - a.threatScore),
    overallRiskScore: overallRisk,
    riskTrend,
    threatWeather,
    timeSeriesData,
    recommendations
  };
};

/**
 * Get threat weather summary (lightweight)
 */
export const getThreatWeather = async (): Promise<ThreatWeather> => {
  const recentThreats = await ThreatIntelligence.find({ isActive: true }).sort({ createdAt: -1 }).limit(50);
  const mockPredictions = THREAT_PATTERNS.map(p => ({
    severity: (recentThreats.filter((t: any) => t.eventType === p.eventType).length > 3 ? "CRITICAL" : "LOW") as any,
    confidence: 70
  }));
  return calculateThreatWeather(mockPredictions as any, recentThreats);
};
