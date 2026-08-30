import React, { useState, useEffect } from "react";
import axios from "axios";
import { Cloud, Sun, CloudRain, CloudLightning, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Shield, Target, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface Forecast {
  generatedAt: string;
  forecastHorizon: string;
  predictions: any[];
  overallRiskScore: number;
  riskTrend: string;
  threatWeather: {
    condition: string;
    severity: string;
    description: string;
    icon: string;
    outlook24h: string;
    outlook48h: string;
    outlook72h: string;
  };
  timeSeriesData: any[];
  recommendations: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#10b981"
};

const RISK_COLORS: Record<string, string> = {
  INCREASING: "text-red-400",
  STABLE: "text-yellow-400",
  DECREASING: "text-emerald-400"
};

export const ThreatOracle: React.FC = () => {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/threats/oracle/forecast");
      setForecast(res.data);
    } catch (err) {
      console.error("Failed to load forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-cyber-cyan animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Generating threat forecast...</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-8 w-8 text-cyber-pink mx-auto mb-4" />
        <p className="text-sm text-slate-400">Failed to load forecast.</p>
        <button onClick={loadForecast} className="mt-4 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg text-xs font-cyber">Retry</button>
      </div>
    );
  }

  const weather = forecast.threatWeather;
  const timeSeriesFormatted = forecast.timeSeriesData.map(d => ({
    ...d,
    hour: new Date(d.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">Predictive Threat Oracle</h2>
          <p className="text-sm text-slate-400">72-hour threat forecast with AI-powered predictions and time-series analysis.</p>
        </div>
        <button onClick={loadForecast} className="px-4 py-2 rounded-3xl border border-slate-800 text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Threat Weather Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-900/80">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{weather.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold font-cyber text-white">{weather.condition}</h3>
              <span className={`px-3 py-1 rounded-full border text-[10px] font-cyber ${SEVERITY_COLORS[weather.severity] ? `text-white bg-opacity-20` : ""}`} style={{ backgroundColor: SEVERITY_COLORS[weather.severity] + "30", borderColor: SEVERITY_COLORS[weather.severity], color: SEVERITY_COLORS[weather.severity] }}>
                {weather.severity}
              </span>
            </div>
            <p className="text-sm text-slate-300">{weather.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {forecast.riskTrend === "INCREASING" && <TrendingUp className="h-5 w-5 text-red-400" />}
              {forecast.riskTrend === "DECREASING" && <TrendingDown className="h-5 w-5 text-emerald-400" />}
              {forecast.riskTrend === "STABLE" && <Minus className="h-5 w-5 text-yellow-400" />}
              <span className={`text-sm font-bold ${RISK_COLORS[forecast.riskTrend]}`}>{forecast.riskTrend}</span>
            </div>
            <p className="text-3xl font-bold text-white">{forecast.overallRiskScore}<span className="text-sm text-slate-500">/100</span></p>
            <p className="text-[10px] text-slate-500">Risk Score</p>
          </div>
        </div>

        {/* Outlook timeline */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-900">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">24 Hours</p>
            <p className="text-xs text-slate-300 mt-1">{weather.outlook24h}</p>
          </div>
          <div className="text-center border-x border-slate-900">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">48 Hours</p>
            <p className="text-xs text-slate-300 mt-1">{weather.outlook48h}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">72 Hours</p>
            <p className="text-xs text-slate-300 mt-1">{weather.outlook72h}</p>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-900/80">
        <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyber-cyan" />
          72-Hour Threat Prediction (Top Threat Type)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesFormatted}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#191826" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: "8px", fontFamily: "JetBrains Mono" }} interval={5} />
              <YAxis stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
              <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#f97316" }} />
              <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="#ef4444" fillOpacity={0.3} fill="url(#colorUpper)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#f97316" fillOpacity={1} fill="url(#colorPredicted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {forecast.predictions.slice(0, 4).map((pred) => (
          <div key={pred.id} className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white">{pred.eventType}</h4>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: SEVERITY_COLORS[pred.severity] }}>{pred.threatScore}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded border`} style={{ color: SEVERITY_COLORS[pred.severity], borderColor: SEVERITY_COLORS[pred.severity], backgroundColor: SEVERITY_COLORS[pred.severity] + "15" }}>
                  {pred.severity}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">{pred.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#04030a]/60 border border-slate-900/40">
                <p className="text-[9px] text-slate-500">Confidence</p>
                <p className="text-sm font-bold text-white">{pred.confidence}%</p>
              </div>
              <div className="p-2 rounded-lg bg-[#04030a]/60 border border-slate-900/40">
                <p className="text-[9px] text-slate-500">Likely Sources</p>
                <p className="text-xs text-slate-300">{pred.likelySourceRegions?.join(", ")}</p>
              </div>
            </div>

            {pred.riskFactors?.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Risk Factors</p>
                {pred.riskFactors.map((f: string, i: number) => (
                  <p key={i} className="text-[10px] text-yellow-400 font-mono">⚠ {f}</p>
                ))}
              </div>
            )}

            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Mitigation</p>
              {pred.mitigationSteps?.slice(0, 3).map((m: string, i: number) => (
                <p key={i} className="text-[10px] text-cyber-cyan font-mono">→ {m}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
        <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyber-violet" />
          Strategic Recommendations
        </h3>
        <div className="space-y-2">
          {forecast.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-900/60 bg-[#04030a]/60">
              <Target className="h-4 w-4 text-cyber-violet mt-0.5 shrink-0" />
              <p className="text-xs text-slate-300 font-mono">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Metadata */}
      <div className="text-center text-[10px] text-slate-600 font-mono">
        Generated: {new Date(forecast.generatedAt).toLocaleString()} | Horizon: {forecast.forecastHorizon} | {forecast.predictions.length} threat types analyzed
      </div>
    </div>
  );
};

export default ThreatOracle;
