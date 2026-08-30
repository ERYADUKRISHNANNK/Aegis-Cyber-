import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Globe,
  Users,
  File,
  Download,
  Share2,
  Shield,
  Activity,
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface GlobalAnalytics {
  overview: { totalFiles: number; totalActivities: number; totalThreats: number };
  topDownloadedFiles: any[];
  topSharedFiles: any[];
  activeUploaders: { username: string; count: number }[];
  activeDownloaders: { username: string; count: number }[];
  activityByType: { type: string; count: number }[];
  activityByCountry: { countryCode: string; country: string; count: number; lat: number; lon: number }[];
  activityByCity: { city: string; country: string; count: number; lat: number; lon: number }[];
  recentActivity: any[];
  dailyTrend: any[];
  threatDistribution: { range: string; count: number }[];
}

const PIE_COLORS = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#ef4444", "#14b8a6"];

const EVENT_COLORS: Record<string, string> = {
  UPLOAD: "text-cyber-cyan",
  DOWNLOAD: "text-emerald-400",
  SHARE: "text-cyber-violet",
  ACCESS_CHECK: "text-yellow-400",
  DELETE: "text-cyber-pink",
  SELF_DESTRUCT: "text-red-400"
};

const EVENT_ICONS: Record<string, string> = {
  UPLOAD: "⬆️",
  DOWNLOAD: "⬇️",
  SHARE: "🔗",
  ACCESS_CHECK: "🔍",
  DELETE: "🗑️",
  SELF_DESTRUCT: "💥"
};

export const Analytics: React.FC = () => {
  const [data, setData] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/analytics/global");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-cyber-cyan animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading global analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-8 w-8 text-cyber-pink mx-auto mb-4" />
        <p className="text-sm text-slate-400 font-mono">Failed to load analytics data.</p>
        <button onClick={loadAnalytics} className="mt-4 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg text-xs font-cyber">
          Retry
        </button>
      </div>
    );
  }

  const typeColors = data.activityByType.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);
  const threatColors = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">Global File Analytics</h2>
          <p className="text-sm text-slate-400">System-wide file lifecycle insights, geographic distribution, and activity trends.</p>
        </div>
        <button onClick={loadAnalytics} className="p-2 rounded-full border border-slate-800 hover:border-cyber-cyan transition">
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <File className="h-4 w-4 text-cyber-cyan" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Files</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.overview.totalFiles}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Activities</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.overview.totalActivities}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-cyber-pink" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Threats Detected</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.overview.totalThreats}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-cyber-violet" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Countries</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.activityByCountry.length}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Activity by Type Pie */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Activity Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.activityByType} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={4} dataKey="count" nameKey="type">
                  {data.activityByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={typeColors[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#8b5cf6" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.activityByType.map((item, idx) => (
              <div key={item.type} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: typeColors[idx] }} />
                <span>{item.type}</span>
                <span className="text-white font-semibold ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Distribution */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Threat Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.threatDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#191826" />
                <XAxis dataKey="range" stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#8b5cf6" }} />
                <Bar dataKey="count" name="Files">
                  {data.threatDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={threatColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Files */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Most Downloaded */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-400" />
            Most Downloaded Files
          </h3>
          <div className="space-y-3">
            {data.topDownloadedFiles.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 font-mono">No download data.</p>
            ) : (
              data.topDownloadedFiles.map((file, idx) => (
                <div key={file._id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-900/60 bg-[#04030a]/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <File className="h-4 w-4 text-cyber-cyan shrink-0" />
                    <span className="text-xs text-white truncate">{file.fileName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
                    <span className="text-emerald-400">{file.totalDownloads} DL</span>
                    <span className="text-cyber-violet">{file.totalShares} SH</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Shared */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-cyber-violet" />
            Most Shared Files
          </h3>
          <div className="space-y-3">
            {data.topSharedFiles.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 font-mono">No share data.</p>
            ) : (
              data.topSharedFiles.map((file, idx) => (
                <div key={file._id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-900/60 bg-[#04030a]/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <File className="h-4 w-4 text-cyber-violet shrink-0" />
                    <span className="text-xs text-white truncate">{file.fileName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
                    <span className="text-cyber-violet">{file.totalShares} SH</span>
                    <span className="text-emerald-400">{file.totalDownloads} DL</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Users & Geographic */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Most Active Uploaders */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyber-cyan" />
            Most Active Uploaders
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activeUploaders.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#191826" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: "9px" }} />
                <YAxis type="category" dataKey="username" stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#06b6d4" }} />
                <Bar dataKey="count" name="Uploads" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Activity */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyber-violet" />
            Geographic Distribution
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {data.activityByCountry.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 font-mono">No geographic data.</p>
            ) : (
              data.activityByCountry.slice(0, 10).map((country) => (
                <div key={country.countryCode} className="flex items-center justify-between p-2 rounded-lg border border-slate-900/40 bg-[#04030a]/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getCountryFlag(country.countryCode)}</span>
                    <span className="text-xs text-white">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyber-violet rounded-full transition-all"
                        style={{ width: `${Math.min((country.count / (data.activityByCountry[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{country.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* City Heatmap */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
        <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyber-gold" />
          City-Level Activity Heatmap
        </h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.activityByCity.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4 font-mono col-span-4">No city data.</p>
          ) : (
            data.activityByCity.slice(0, 12).map((city, idx) => (
              <div
                key={`${city.city}-${city.country}`}
                className="p-3 rounded-xl border border-slate-900/60 transition hover:border-cyber-cyan/40"
                style={{ background: `rgba(6, 182, 212, ${Math.min(city.count / (data.activityByCity[0]?.count || 1) * 0.15, 0.15)})` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-semibold">{city.city}</span>
                  <span className="text-[10px] font-mono text-cyber-cyan">{city.count}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">{city.country}</p>
                <p className="text-[9px] text-slate-600 font-mono">{city.lat != null ? `${city.lat.toFixed(1)}°` : ""}{city.lon != null ? ` ${city.lon.toFixed(1)}°` : ""}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
        <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyber-cyan" />
          Recent Activity Feed
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {data.recentActivity.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4 font-mono">No recent activity.</p>
          ) : (
            data.recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  activity.success
                    ? "border-slate-900/60 bg-[#04030a]/60"
                    : "border-red-900/40 bg-red-950/10"
                }`}
              >
                <span className="text-lg">{EVENT_ICONS[activity.eventType] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold font-cyber uppercase ${EVENT_COLORS[activity.eventType] || "text-slate-400"}`}>
                      {activity.eventType}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 truncate">
                    {activity.fileName} — by {activity.performedBy}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-mono">
                    <span>{activity.ipAddress}</span>
                    {activity.geoLocation?.city && activity.geoLocation.city !== "Unknown" && (
                      <span>{activity.geoLocation.city}, {activity.geoLocation.country}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const base = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + base, code.charCodeAt(1) + base);
}

export default Analytics;
