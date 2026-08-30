import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  File,
  Download,
  Share2,
  Shield,
  Globe,
  Clock,
  MapPin,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Wifi
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
  Bar
} from "recharts";

interface FileStats {
  fileId: string;
  fileName: string;
  owner: any;
  createdAt: string;
  totalDownloads: number;
  totalShares: number;
  uniqueViewerCount: number;
  lastAccessedAt: string;
  lastAccessedBy: string;
  lastAccessedByGeo: any;
  uploadIpAddress: string;
  uploadGeoLocation: any;
  versionNumber: number;
  activityByType: { type: string; count: number }[];
  accessLocations: { ip: string; count: number; city: string; country: string; countryCode: string; lat: number; lon: number }[];
  dailyActivity: { date: string; count: number }[];
  viewerBreakdown: { username: string; downloads: number; shares: number }[];
  shareRecipients: { username: string; shareCount: number; lastShared: string }[];
}

interface Activity {
  id: string;
  eventType: string;
  performedBy: string;
  timestamp: string;
  ipAddress: string;
  geoLocation: any;
  recipientUsername: string;
  success: boolean;
  failureReason: string;
  metadata: any;
}

const EVENT_COLORS: Record<string, string> = {
  UPLOAD: "text-cyber-cyan",
  DOWNLOAD: "text-emerald-400",
  SHARE: "text-cyber-violet",
  ACCESS_CHECK: "text-yellow-400",
  DELETE: "text-cyber-pink",
  EXPIRY: "text-orange-400",
  SELF_DESTRUCT: "text-red-400",
  VERSION_CREATE: "text-blue-400",
  EMERGENCY_LOCK: "text-red-500",
  UNLOCK: "text-green-400"
};

const EVENT_ICONS: Record<string, string> = {
  UPLOAD: "⬆️",
  DOWNLOAD: "⬇️",
  SHARE: "🔗",
  ACCESS_CHECK: "🔍",
  DELETE: "🗑️",
  EXPIRY: "⏰",
  SELF_DESTRUCT: "💥",
  VERSION_CREATE: "📋",
  EMERGENCY_LOCK: "🔒",
  UNLOCK: "🔓"
};

const PIE_COLORS = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#ef4444", "#14b8a6"];

export const FileLifecycle: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<FileStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "stats" | "geo">("timeline");

  useEffect(() => {
    if (fileId) {
      loadData();
    }
  }, [fileId]);

  const loadData = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        axios.get(`/api/analytics/files/${fileId}/stats`),
        axios.get(`/api/analytics/files/${fileId}/activity?limit=50`)
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data.activities || []);
    } catch (err) {
      console.error("Failed to load file lifecycle data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "Never";
    return new Date(ts).toLocaleString();
  };

  const formatTimeAgo = (ts: string) => {
    if (!ts) return "Never";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-cyber-cyan animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading file provenance data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-cyber-pink mx-auto" />
          <p className="text-sm text-slate-400 font-mono">File not found or access denied.</p>
          <button onClick={() => navigate("/vault")} className="px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg text-xs font-cyber">
            Return to Vault
          </button>
        </div>
      </div>
    );
  }

  const typeColors = stats.activityByType.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full border border-slate-800 hover:border-cyber-cyan transition">
          <ArrowLeft className="h-4 w-4 text-slate-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <File className="h-6 w-6 text-cyber-cyan" />
            <div>
              <h2 className="text-xl font-bold font-cyber text-white">{stats.fileName}</h2>
              <p className="text-xs text-slate-400 font-mono">File Provenance & Lifecycle Forensics</p>
            </div>
          </div>
        </div>
        <button onClick={loadData} className="p-2 rounded-full border border-slate-800 hover:border-cyber-cyan transition">
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-cyber-violet" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Shares</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalShares}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-cyber-cyan" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Unique Viewers</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.uniqueViewerCount}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-cyber-gold" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Version</span>
          </div>
          <p className="text-2xl font-bold text-white">v{stats.versionNumber}</p>
        </div>
      </div>

      {/* Origin & Last Access Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-cyber-cyan uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Upload Origin
          </h3>
          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">IP Address</span>
              <span className="text-white">{stats.uploadIpAddress || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">City</span>
              <span>{stats.uploadGeoLocation?.city || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Country</span>
              <span>{stats.uploadGeoLocation?.country || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ISP</span>
              <span>{stats.uploadGeoLocation?.isp || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span>{formatTime(stats.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-cyber-violet uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last Access
          </h3>
          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Accessed By</span>
              <span className="text-white">{stats.lastAccessedBy || "Never"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time</span>
              <span>{formatTime(stats.lastAccessedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span>{stats.lastAccessedByGeo?.city || "Unknown"}, {stats.lastAccessedByGeo?.country || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IP Address</span>
              <span>{stats.lastAccessedByGeo?.isp || "Unknown"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-900 pb-2">
        {(["timeline", "stats", "geo"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-cyber uppercase tracking-[0.2em] rounded-t-lg transition ${
              activeTab === tab
                ? "bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "timeline" ? "Activity Timeline" : tab === "stats" ? "Statistics" : "Geographic Map"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Activity Timeline</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8 font-mono">No activity recorded yet.</p>
            ) : (
              activities.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                    activity.success
                      ? "border-slate-900/60 bg-[#04030a]/60 hover:bg-[#06050f]/80"
                      : "border-red-900/40 bg-red-950/10"
                  }`}
                >
                  <span className="text-lg">{EVENT_ICONS[activity.eventType] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold font-cyber uppercase ${EVENT_COLORS[activity.eventType] || "text-slate-400"}`}>
                        {activity.eventType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activity.performedBy}
                      {activity.eventType === "SHARE" && activity.recipientUsername && (
                        <span> → <span className="text-cyber-violet">{activity.recipientUsername}</span></span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {activity.ipAddress}
                      </span>
                      {activity.geoLocation?.city && activity.geoLocation.city !== "Unknown" && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.geoLocation.city}, {activity.geoLocation.country}
                        </span>
                      )}
                    </div>
                    {!activity.success && activity.failureReason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-950/20 border border-red-900/30 text-[10px] text-red-300 font-mono">
                        <XCircle className="h-3 w-3 inline mr-1" />
                        {activity.failureReason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Activity by Type Pie Chart */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Activity Breakdown</h3>
            {stats.activityByType.length > 0 ? (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.activityByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="type"
                      >
                        {stats.activityByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={typeColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#8b5cf6" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {stats.activityByType.map((item, idx) => (
                    <div key={item.type} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: typeColors[idx] }} />
                        <span className="text-slate-300">{item.type}</span>
                      </div>
                      <span className="text-white font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-xs text-center py-8 font-mono">No activity data.</p>
            )}
          </div>

          {/* Daily Activity Chart */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Daily Activity (30 days)</h3>
            {stats.dailyActivity.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyActivity}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#191826" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#06b6d4" }} />
                    <Area type="monotone" dataKey="count" name="Events" stroke="#06b6d4" fillOpacity={1} fill="url(#colorActivity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-8 font-mono">No daily activity data.</p>
            )}
          </div>

          {/* Viewer Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Viewer Breakdown</h3>
            {stats.viewerBreakdown.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.viewerBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#191826" />
                    <XAxis dataKey="username" stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#64748b" style={{ fontSize: "9px", fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#07060f", borderColor: "#8b5cf6" }} />
                    <Bar dataKey="downloads" name="Downloads" fill="#06b6d4" />
                    <Bar dataKey="shares" name="Shares" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-8 font-mono">No viewer data.</p>
            )}
          </div>

          {/* Share Recipients */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4">Share Recipients</h3>
            {stats.shareRecipients.length > 0 ? (
              <div className="space-y-3">
                {stats.shareRecipients.map((recipient) => (
                  <div key={recipient.username} className="flex items-center justify-between p-3 rounded-xl border border-slate-900/60 bg-[#04030a]/60">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyber-violet/20 border border-cyber-violet/40 flex items-center justify-center">
                        <Users className="h-4 w-4 text-cyber-violet" />
                      </div>
                      <div>
                        <p className="text-xs text-white font-semibold">{recipient.username}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Last shared: {formatTimeAgo(recipient.lastShared)}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-cyber-violet/10 border border-cyber-violet/30 text-[10px] text-cyber-violet font-cyber">
                      {recipient.shareCount} shares
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-8 font-mono">No shares recorded.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "geo" && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-900/80">
          <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyber-cyan" />
            Geographic Access Map
          </h3>
          {stats.accessLocations.length > 0 ? (
            <div className="space-y-4">
              {/* Access location cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.accessLocations.map((loc, idx) => (
                  <div key={loc.ip + idx} className="p-3 rounded-xl border border-slate-900/60 bg-[#04030a]/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white font-semibold">{loc.city}, {loc.country}</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyber-cyan/10 text-[10px] text-cyber-cyan font-cyber">{loc.count} events</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">IP: {loc.ip}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Coords: {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</p>
                  </div>
                ))}
              </div>

              {/* Global access summary */}
              <div className="p-4 rounded-xl border border-slate-900/60 bg-[#04030a]/60 mt-4">
                <h4 className="text-xs font-bold font-cyber text-slate-400 uppercase tracking-[0.2em] mb-3">Access Distribution</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-white">{stats.accessLocations.length}</p>
                    <p className="text-[10px] text-slate-500">Unique IPs</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-cyber-cyan">{[...new Set(stats.accessLocations.map(l => l.country))].length}</p>
                    <p className="text-[10px] text-slate-500">Countries</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-cyber-violet">{[...new Set(stats.accessLocations.map(l => l.city))].length}</p>
                    <p className="text-[10px] text-slate-500">Cities</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center py-8 font-mono">No geographic access data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileLifecycle;
