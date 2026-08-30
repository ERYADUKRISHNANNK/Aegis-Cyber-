import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Inbox,
  Download,
  Clock,
  Shield,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lock,
  RefreshCw,
  MapPin,
  Calendar,
  Eye,
  ArrowRight,
  LockIcon,
  XCircle,
} from "lucide-react";

interface SharedFile {
  _id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cid: string;
  threatScore: number;
  owner: { _id: string; username: string; email: string };
  sharedAt: string;
  validUntil: string | null;
  maxDownloads: number;
  downloadCount: number;
  sharedByIp: string;
  sharedByGeo: {
    city?: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
    isp?: string;
  };
  isActive: boolean;
  isExpired: boolean;
  isDownloadLimitReached: boolean;
  isLocked: boolean;
  uploadGeoLocation: {
    city?: string;
    country?: string;
  };
  createdAt: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatTimeAgo = (ts?: string) => {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatExpiry = (ts?: string | null) => {
  if (!ts) return "No expiry";
  const diff = new Date(ts).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m left`;
  return `${Math.floor(hours / 24)}d left`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("audio")) return "🎵";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation")) return "📊";
  return "📎";
};

export const SharedInbox: React.FC = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>("success");
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  const fetchSharedFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/files/shared-with-me");
      setFiles(res.data.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const handleDownload = async (file: SharedFile) => {
    setDownloadingId(file._id);
    try {
      const res = await axios.get(`/api/files/download/${file._id}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      // Refresh to update download count
      setTimeout(fetchSharedFiles, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Download failed."; setToastMsg(msg); setToastType("error"); setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredFiles = files.filter((f) => {
    if (filter === "active") return f.isActive;
    if (filter === "expired") return f.isExpired || f.isDownloadLimitReached || f.isLocked;
    return true;
  });

  const activeCount = files.filter((f) => f.isActive).length;
  const expiredCount = files.filter((f) => f.isExpired || f.isDownloadLimitReached || f.isLocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">Shared Files Inbox</h2>
          <p className="text-sm text-slate-400">
            Files shared with you by other operators. Download, track, and manage incoming assets.
          </p>
        </div>
        <button
          onClick={fetchSharedFiles}
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-800/80 bg-[#050712]/90 px-4 py-3 text-sm text-slate-300 transition hover:border-cyber-cyan hover:text-cyber-cyan"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-panel rounded-2xl border border-slate-900/80 p-4">
          <p className="text-[10px] font-bold font-cyber text-slate-500 uppercase tracking-[0.2em]">
            Total Received
          </p>
          <p className="mt-1 text-3xl font-bold font-cyber text-white">{files.length}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-green-500/20 p-4">
          <p className="text-[10px] font-bold font-cyber text-green-500 uppercase tracking-[0.2em]">
            Active
          </p>
          <p className="mt-1 text-3xl font-bold font-cyber text-green-400">{activeCount}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-red-500/20 p-4">
          <p className="text-[10px] font-bold font-cyber text-red-500 uppercase tracking-[0.2em]">
            Expired / Limited
          </p>
          <p className="mt-1 text-3xl font-bold font-cyber text-red-400">{expiredCount}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-cyber-violet/20 p-4">
          <p className="text-[10px] font-bold font-cyber text-cyber-violet uppercase tracking-[0.2em]">
            Filters
          </p>
          <div className="mt-2 flex gap-2">
            {(["all", "active", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  filter === f
                    ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40"
                    : "border border-slate-800/80 text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="glass-panel rounded-2xl border border-slate-900/80 p-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyber-cyan" />
          <p className="mt-3 text-sm text-slate-500 font-mono">Loading shared files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-900/80 p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-slate-700" />
          <p className="mt-3 text-sm text-slate-500 font-mono">
            {filter === "all"
              ? "No files shared with you yet."
              : filter === "active"
              ? "No active shares."
              : "No expired or limited shares."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={
                file.isActive
                  ? "border-slate-900/80 hover:border-cyber-cyan/30"
                  : file.isExpired
                  ? "border-red-500/20 opacity-60"
                  : "border-yellow-500/20 opacity-60"
              }
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800/80 bg-[#04040d]/90 text-xl">{getFileIcon(file.mimeType)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{file.fileName}</h3>
                        {file.isActive&&<span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-400 border border-green-500/20">Active</span>}
                        {file.isExpired&&<span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20">Expired</span>}
                        {file.isDownloadLimitReached&&<span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/20">Limit Reached</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono"><span>{formatSize(file.fileSize)}</span><span className="text-slate-700">&bull;</span><span>from {file.owner?.username||"Unknown"}</span><span className="text-slate-700">&bull;</span><span>{formatTimeAgo(file.sharedAt)}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3"/><span className={file.isExpired?"text-red-400":""}>{formatExpiry(file.validUntil)}</span></div>
                    <div className="flex items-center gap-1"><Download className="h-3 w-3"/><span>{file.downloadCount}{file.maxDownloads>0?"/"+file.maxDownloads:""} dl</span></div>
                    {file.sharedByGeo?.city&&file.sharedByGeo.city!=="Unknown"&&<div className="flex items-center gap-1"><MapPin className="h-3 w-3"/><span>{file.sharedByGeo.city}{file.sharedByGeo.country?", "+file.sharedByGeo.country:""}</span></div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>window.open("/file/"+file._id,"_blank")} className="rounded-full border border-slate-800/80 bg-[#04040d]/90 p-2 text-cyber-gold transition hover:border-cyber-gold"><Globe className="h-4 w-4"/></button>
                    <button onClick={()=>handleDownload(file)} disabled={!file.isActive||downloadingId===file._id} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${file.isActive?"border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20":"border-slate-800/80 bg-[#04040d]/90 text-slate-600 cursor-not-allowed"}`}>
                      {downloadingId===file._id?<RefreshCw className="h-3 w-3 animate-spin"/>:file.isActive?<Download className="h-3 w-3"/>:file.isExpired?<XCircle className="h-3 w-3"/>:<Lock className="h-3 w-3"/>}
                      {downloadingId===file._id?"Downloading...":file.isActive?"Download":file.isExpired?"Expired":"Unavailable"}
                    </button>
                  </div>
                </div>
              </div>))}
            </div>
          )}
        </div>
      );
    };
    export default SharedInbox;
