import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bot, Shield, Search, ClipboardList, FileSearch, RefreshCw, Play, AlertTriangle, CheckCircle2, Clock, Zap } from "lucide-react";

interface AgentStatus {
  name: string;
  role: string;
  status: "idle" | "analyzing" | "reporting";
  lastAction: string;
  lastActionTime: string | null;
}

interface AgentResult {
  agent: string;
  confidence: number;
  findings: string[];
  recommendations: string[];
  mitreTactics: string[];
  severity: string;
  data: any;
}

interface SwarmReport {
  timestamp: string;
  overallSeverity: string;
  overallConfidence: number;
  agents: AgentResult[];
  summary: {
    totalFindings: number;
    totalRecommendations: number;
    mitreTacticsCovered: number;
  };
  coordinationLog: { timestamp: string; message: string }[];
}

const AGENT_ICONS: Record<string, any> = {
  Scanner: Search,
  Responder: Shield,
  Forensics: FileSearch,
  Compliance: ClipboardList
};

const AGENT_COLORS: Record<string, string> = {
  Scanner: "text-cyber-cyan",
  Responder: "text-cyber-pink",
  Forensics: "text-cyber-gold",
  Compliance: "text-emerald-400"
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-950/30 border-red-900/50",
  HIGH: "text-orange-400 bg-orange-950/30 border-orange-900/50",
  MEDIUM: "text-yellow-400 bg-yellow-950/30 border-yellow-900/50",
  LOW: "text-emerald-400 bg-emerald-950/30 border-emerald-900/50"
};

export const AgentSwarm: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [report, setReport] = useState<SwarmReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await axios.get("/api/threats/swarm/status");
      setStatus(res.data);
    } catch {}
  };

  const runSwarm = async (agentName?: string) => {
    setIsRunning(true);
    try {
      const endpoint = agentName
        ? `/api/threats/swarm/agent/${agentName}`
        : "/api/threats/swarm/analyze";
      const res = await axios.post(endpoint, {});
      if (agentName) {
        setReport(prev => prev ? { ...prev, agents: [...prev.agents.filter(a => a.agent !== agentName), res.data] } : null);
      } else {
        setReport(res.data);
      }
    } catch (err) {
      console.error("Swarm analysis failed:", err);
    } finally {
      setIsRunning(false);
      loadStatus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">AI Agent Swarm</h2>
          <p className="text-sm text-slate-400">Multi-agent collaborative security analysis with MITRE ATT&CK mapping.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => runSwarm()} disabled={isRunning} className="px-4 py-2 rounded-3xl bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan text-xs font-cyber hover:bg-cyber-cyan/20 disabled:opacity-50">
            {isRunning ? <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" /> : <Play className="h-3 w-3 inline mr-1" />}
            Run Full Swarm
          </button>
          <button onClick={loadStatus} className="px-3 py-2 rounded-3xl border border-slate-800 text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {(status?.agents || ["Scanner", "Responder", "Forensics", "Compliance"]).map((agent: any) => {
          const name = typeof agent === "string" ? agent : agent.name;
          const Icon = AGENT_ICONS[name] || Bot;
          const color = AGENT_COLORS[name] || "text-slate-400";
          const agentData = typeof agent === "object" ? agent : null;
          const result = report?.agents?.find(a => a.agent === name);

          return (
            <div key={name} className="glass-panel rounded-2xl p-4 border border-slate-900/80 hover:border-slate-800 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-800`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{name}</h3>
                  <p className="text-[9px] text-slate-500 font-mono">{typeof agent === "object" ? agent.role : "Agent"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${agentData?.status === "analyzing" ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
                <span className="text-[10px] text-slate-400 font-mono">{agentData?.status || "idle"}</span>
                {result && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[result.severity] || "text-slate-400"}`}>
                    {result.severity}
                  </span>
                )}
              </div>

              {result && (
                <div className="text-[10px] text-slate-400 font-mono space-y-1 mb-3">
                  <p>{result.findings.length} findings</p>
                  <p>{result.confidence}% confidence</p>
                </div>
              )}

              <button onClick={() => runSwarm(name)} disabled={isRunning} className="w-full py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan font-cyber transition disabled:opacity-50">
                Run {name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Swarm Report */}
      {report && (
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          <div className="space-y-4">
            {/* Overall Assessment */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em]">Swarm Assessment</h3>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-cyber ${SEVERITY_COLORS[report.overallSeverity]}`}>
                  {report.overallSeverity}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{report.overallConfidence}%</p>
                  <p className="text-[10px] text-slate-500">Confidence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyber-cyan">{report.summary.totalFindings}</p>
                  <p className="text-[10px] text-slate-500">Findings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyber-violet">{report.summary.mitreTacticsCovered}</p>
                  <p className="text-[10px] text-slate-500">MITRE Tactics</p>
                </div>
              </div>
            </div>

            {/* Agent Results */}
            {report.agents.map((result) => {
              const Icon = AGENT_ICONS[result.agent] || Bot;
              const color = AGENT_COLORS[result.agent] || "text-slate-400";
              return (
                <div key={result.agent} className="glass-panel rounded-2xl p-5 border border-slate-900/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <h4 className="text-sm font-bold text-white">{result.agent}</h4>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[9px] border ${SEVERITY_COLORS[result.severity]}`}>
                      {result.severity} | {result.confidence}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Findings</p>
                      {result.findings.map((f, i) => (
                        <p key={i} className="text-xs text-slate-300 font-mono mb-1">• {f}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recommendations</p>
                      {result.recommendations.map((r, i) => (
                        <p key={i} className="text-xs text-cyber-cyan font-mono mb-1">→ {r}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.mitreTactics.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-950/30 border border-red-900/40 text-[9px] text-red-300 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coordination Log */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyber-gold" />
              Coordination Log
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {report.coordinationLog?.map((log, i) => (
                <div key={i} className="p-2 rounded-lg border border-slate-900/40 bg-[#04030a]/40">
                  <p className="text-[9px] text-slate-400 font-mono">{log.message}</p>
                  <p className="text-[8px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
              {(!report.coordinationLog || report.coordinationLog.length === 0) && (
                <p className="text-slate-500 text-[10px] text-center py-4 font-mono">No coordination events yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSwarm;
