import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { Download, Shield, Clock, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface ShareInfo {
  fileName: string;
  fileSize: number;
  mimeType: string;
  owner: { _id: string; username: string; email: string };
  threatScore: number;
  validUntil: string | null;
  maxDownloads: number;
  downloadCount: number;
}

const formatSize = (b: number) => { if (!b) return "0 B"; const k=1024,s=["B","KB","MB","GB"],i=Math.floor(Math.log(b)/Math.log(k)); return (b/Math.pow(k,i)).toFixed(1)+" "+s[i]; };

export const PublicShare: React.FC = () => {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>("success");

  const token = window.location.pathname.split("/share/")[1];

  useEffect(() => {
    if (!token) { setError("Invalid share link."); setLoading(false); return; }
    axios.get(`/api/files/public-share/${token}`)
      .then(r => setInfo(r.data))
      .catch(e => setError(e.response?.data?.error || "Invalid share link."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const r = await axios.get(`/api/files/public-download/${token}`, { responseType: "blob" });
      const u = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a"); a.href = u; a.download = info?.fileName || "file";
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(u);
    } catch (e: any) {
      setToastMsg(e.response?.data?.error || "Download failed."); setToastType("error");
    } finally { setDownloading(false); }
  };

  const shareUrl = window.location.href;

  if (loading) return (
    <div className="min-h-screen bg-[#030510] flex items-center justify-center">
      <div className="text-center"><div className="animate-spin h-8 w-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-sm text-slate-500 font-mono">Loading share info...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#030510] flex items-center justify-center">
      <div className="glass-panel rounded-2xl border border-red-500/20 p-8 max-w-md text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Share Unavailable</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <div className="mt-6">
          <QRCodeSVG value={shareUrl} size={120} bgColor="#030510" fgColor="#ef4444" />
          <p className="mt-2 text-[9px] font-mono text-red-400/50">QR Code (expired)</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030510] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="glass-panel rounded-2xl border border-cyber-cyan/20 p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-cyber-cyan mb-4" />
          <h1 className="text-xl font-bold font-cyber text-white mb-1">AEGIS Secure Share</h1>
          <p className="text-xs text-slate-500 font-mono">Encrypted file shared via secure link</p>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-900/80 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-[#04040d]/90">
              <FileText className="h-5 w-5 text-cyber-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{info!.fileName}</h2>
              <p className="text-[10px] font-mono text-slate-500">{formatSize(info!.fileSize)} &bull; Shared by {info!.owner?.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {info!.validUntil && (
              <div className="rounded-lg border border-slate-900/80 p-3 text-center">
                <Clock className="mx-auto h-4 w-4 text-cyber-gold mb-1" />
                <p className="text-[9px] font-mono text-slate-500">Expires</p>
                <p className="text-xs font-semibold text-white">{new Date(info!.validUntil).toLocaleDateString()}</p>
              </div>
            )}
            {info!.maxDownloads > 0 && (
              <div className="rounded-lg border border-slate-900/80 p-3 text-center">
                <Download className="mx-auto h-4 w-4 text-cyber-violet mb-1" />
                <p className="text-[9px] font-mono text-slate-500">Downloads</p>
                <p className="text-xs font-semibold text-white">{info!.downloadCount}/{info!.maxDownloads}</p>
              </div>
            )}
            <div className="rounded-lg border border-green-500/20 p-3 text-center">
              <CheckCircle className="mx-auto h-4 w-4 text-green-500 mb-1" />
              <p className="text-[9px] font-mono text-slate-500">Threat Score</p>
              <p className="text-xs font-semibold text-green-400">{info!.threatScore === 0 ? "Clean" : `${info!.threatScore}/100`}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 py-3 text-sm font-semibold text-cyber-cyan transition hover:bg-cyber-cyan/20 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Downloading..." : "Download File"}
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-900/80 p-4 text-center">
          <QRCodeSVG value={shareUrl} size={140} bgColor="#06060f" fgColor="#06b6d4" level="M" />
          <p className="mt-2 text-[9px] font-mono text-slate-600">Scan to access this share on another device</p>
        </div>

        <p className="text-center text-[9px] font-mono text-slate-700">
          Protected by AEGIS NEXUS Zero Trust Gateway
        </p>
      </div>
    </div>
  );
};

export default PublicShare;
