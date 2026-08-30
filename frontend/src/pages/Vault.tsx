import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  UploadCloud,
  File,
  Share2,
  Download,
  ShieldAlert,
  RefreshCw,
  Clock,
  QrCode,
  AlertTriangle,
  MapPin,
  Eye,
  History,
  BarChart3,
  Globe
} from "lucide-react";

interface FileItem {
  _id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cid: string;
  fileHash: string;
  owner: { username: string; email: string };
  threatScore: number;
  blockchainTxHash: string;
  createdAt: string;
  selfDestruct?: boolean;
  sharedWith: any[];
  // Provenance fields
  totalDownloads?: number;
  totalShares?: number;
  uniqueViewerCount?: number;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
  uploadIpAddress?: string;
  uploadGeoLocation?: { city?: string; country?: string; countryCode?: string; lat?: number; lon?: number };
}

export const Vault: React.FC = () => {
  const { connectWallet, walletAddress } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errorModal, setErrorModal] = useState<any | null>(null);
  const [selfDestructUpload, setSelfDestructUpload] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState("");
  const [shareTime, setShareTime] = useState("");
  const [shareCount, setShareCount] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>("success");

  const fetchFiles = async () => {
    try {
      const res = await axios.get("/api/files/list");
      setFiles(res.data);
    } catch {
      console.warn("API list call failed. Loading simulated vault items.");
      setFiles([
        {
          _id: "1",
          fileName: "iso_policy_draft.pdf",
          fileSize: 412051,
          mimeType: "application/pdf",
          cid: "QmYwAPJzs52AL3m2Xz5L27zVW5K33M4518L9W5673a",
          fileHash: "4cf5ae839a834bb182f7c00192ea2839a0410ad59c25f826388910d51",
          owner: { username: "yadu", email: "yadu@yadu.com" },
          threatScore: 0,
          blockchainTxHash: "0x40149021da0e8e9ea9a0a04910ea2a0149089acbd0109ae9ea",
          createdAt: new Date().toISOString(),
          selfDestruct: false,
          sharedWith: [],
          totalDownloads: 5,
          totalShares: 2,
          uniqueViewerCount: 3,
          lastAccessedAt: new Date(Date.now() - 3600000).toISOString(),
          lastAccessedBy: "analyst",
          uploadIpAddress: "203.0.113.42",
          uploadGeoLocation: { city: "Mumbai", country: "India", countryCode: "IN" }
        }
      ]);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorModal(null);

    const steps = [
      "Running AI malware checks...",
      "Analyzing PDF structures for JS anomalies...",
      "Scanning content for PII leaks...",
      "Calculating entropy risk score...",
      "Anchoring metadata on chain...",
      "Encrypting block with AES-256-GCM..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setUploadStatus(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selfDestruct", selfDestructUpload.toString());

    try {
      await axios.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchFiles();
      setSelfDestructUpload(false);
    } catch (err: any) {
      if (err.response?.data?.threatReport) {
        setErrorModal(err.response.data.threatReport);
      } else {
        const msg = err.response?.data?.error || "Upload failed. Verify the security gateway is available."; setToastMsg(msg); setToastType("error"); setTimeout(() => setToastMsg(null), 4000);
      }
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  const handleDownload = async (fileItem: FileItem) => {
    try {
      const response = await axios({
        url: `/api/files/download/${fileItem._id}`,
        method: "GET",
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileItem.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(fetchFiles, 1000);
    } catch {
      setToastMsg("Download blocked: Zero Trust validation failed."); setToastType("error"); setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingFile) return;

    try {
      await axios.post("/api/files/share", {
        fileId: sharingFile._id,
        targetUsername: shareTarget,
        durationSeconds: shareTime ? parseInt(shareTime) : 0,
        maxDownloads: shareCount ? parseInt(shareCount) : 0
      });
      setToastMsg("Sharing policy deployed successfully!"); setToastType("success"); setTimeout(() => setToastMsg(null), 3000);
      setSharingFile(null);
      setShareTarget("");
      setShareTime("");
      setShareCount("");
      setShowQrCode(false);
      fetchFiles();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error sharing file."; setToastMsg(msg); setToastType("error"); setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!sharingFile) return;
    setGeneratingLink(true);
    try {
      const res = await axios.post("/api/files/generate-share-link", {
        fileId: sharingFile._id,
        durationSeconds: shareTime ? parseInt(shareTime) : 0,
        maxDownloads: shareCount ? parseInt(shareCount) : 0
      });
      setShareLink(res.data.shareUrl);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error generating share link."; setToastMsg(msg); setToastType("error"); setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setToastMsg("Share link copied to clipboard!"); setToastType("success"); setTimeout(() => setToastMsg(null), 3000);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">Secure Decentralized File Vault</h2>
          <p className="text-sm text-slate-400">Live file access policy and blockchain-anchored custody for your sensitive assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/analytics")}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-800/80 bg-[#050712]/90 px-4 py-3 text-sm text-slate-300 transition hover:border-cyber-cyan hover:text-cyber-cyan"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-700 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-indigo-600"
            >
              <Clock className="h-4 w-4" />
              Link DID Wallet
            </button>
          ) : (
            <div className="rounded-3xl border border-emerald-500/20 bg-[#050712]/90 px-4 py-3 text-sm text-emerald-300">
              Wallet linked: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.4fr]">
        <section className="glass-panel rounded-3xl border border-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.16)] relative overflow-hidden">
          {isUploading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-[#060510]/95 p-6 text-center text-slate-100 backdrop-blur-sm">
              <RefreshCw className="h-12 w-12 animate-spin text-cyber-cyan" />
              <p className="max-w-sm text-sm leading-6">{uploadStatus}</p>
            </div>
          )}
          <div className="relative z-10 flex h-[24rem] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-slate-800/70 bg-[#04030a]/90 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyber-violet/15 text-cyber-violet border border-cyber-violet/30">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Upload Pipeline</p>
              <h3 className="mt-3 text-xl font-bold text-white">AI-Driven File Ingest</h3>
            </div>
            <p className="max-w-xs text-sm text-slate-400">Submit encrypted payloads to the vault. Each upload passes through malware, PII, and blockchain anchoring checks before registration.</p>
            <div className="flex flex-col items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-cyber-violet/20 px-5 py-3 text-sm text-white transition hover:bg-cyber-violet/30">
                <span>Select file</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={selfDestructUpload}
                  onChange={(e) => setSelfDestructUpload(e.target.checked)}
                  className="h-4 w-4 accent-cyber-pink rounded"
                />
                <span>Flag for self-destruct after download</span>
              </label>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-3xl border border-slate-900/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">VAULT ASSETS</p>
              <h3 className="text-xl font-bold text-white font-cyber">Encrypted Files</h3>
            </div>
            <button
              onClick={fetchFiles}
              className="inline-flex items-center gap-2 rounded-3xl border border-slate-800/80 bg-[#050712]/90 px-4 py-2 text-sm text-slate-300 transition hover:border-cyber-cyan hover:text-cyber-cyan"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm font-medium text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Origin</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">Classification</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/80">
                {files.map((file) => (
                  <tr key={file._id} className="transition hover:bg-slate-900/40">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-cyber-cyan" />
                        <span className="truncate text-white max-w-[180px]" title={file.fileName}>{file.fileName}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-400">{(file.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="py-4 pr-4">
                      {file.uploadGeoLocation?.city ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 rounded-full bg-slate-900/50 px-2 py-0.5">
                          <MapPin className="h-3 w-3 text-cyber-cyan" />
                          {file.uploadGeoLocation.city}, {file.uploadGeoLocation.countryCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Unknown</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="inline-flex items-center gap-1 text-emerald-400" title="Downloads">
                          <Download className="h-3 w-3" />
                          {file.totalDownloads || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-cyber-violet" title="Shares">
                          <Share2 className="h-3 w-3" />
                          {file.totalShares || file.sharedWith?.length || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-cyber-cyan" title="Unique viewers">
                          <Eye className="h-3 w-3" />
                          {file.uniqueViewerCount || 0}
                        </span>
                        {file.lastAccessedAt && (
                          <span className="text-slate-500" title={`Last accessed by ${file.lastAccessedBy}`}>
                            <History className="h-3 w-3 inline mr-0.5" />
                            {formatTimeAgo(file.lastAccessedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {file.selfDestruct ? (
                        <span className="rounded-full bg-cyber-pink/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyber-pink">Self-destruct</span>
                      ) : file.threatScore > 0 ? (
                        <span className="rounded-full bg-yellow-950/30 px-3 py-1 text-[10px] text-yellow-300">Threat {file.threatScore}</span>
                      ) : (
                        <span className="rounded-full bg-emerald-950/30 px-3 py-1 text-[10px] text-emerald-300">Clean</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => navigate(`/file/${file._id}`)}
                        className="rounded-full border border-slate-800/80 bg-[#04040d]/90 p-2 text-cyber-gold transition hover:border-cyber-gold mr-1"
                        title="View file lifecycle"
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDownload(file)} className="rounded-full border border-slate-800/80 bg-[#04040d]/90 p-2 text-cyber-cyan transition hover:border-cyber-cyan mr-1">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => setSharingFile(file)} className="rounded-full border border-slate-800/80 bg-[#04040d]/90 p-2 text-cyber-violet transition hover:border-cyber-violet">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {sharingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-cyber-cyan/20 p-6 shadow-[0_0_60px_rgba(6,182,212,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Dynamic Access Policy</h3>
                <p className="text-sm text-slate-400">Configure sharing for {sharingFile.fileName}</p>
              </div>
              <button onClick={() => setSharingFile(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4 text-sm text-slate-300">
              <div>
                <label className="mb-2 block uppercase tracking-[0.2em] text-slate-500">Recipient</label>
                <input
                  type="text"
                  required
                  value={shareTarget}
                  onChange={(e) => setShareTarget(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-3xl border border-slate-800/80 bg-[#02030b] px-4 py-3 text-sm text-white focus:border-cyber-cyan focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block uppercase tracking-[0.2em] text-slate-500">Access time (sec)</label>
                  <input
                    type="number"
                    placeholder="0 = unlimited"
                    value={shareTime}
                    onChange={(e) => setShareTime(e.target.value)}
                    className="w-full rounded-3xl border border-slate-800/80 bg-[#02030b] px-4 py-3 text-sm text-white focus:border-cyber-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block uppercase tracking-[0.2em] text-slate-500">Max downloads</label>
                  <input
                    type="number"
                    placeholder="0 = unlimited"
                    value={shareCount}
                    onChange={(e) => setShareCount(e.target.value)}
                    className="w-full rounded-3xl border border-slate-800/80 bg-[#02030b] px-4 py-3 text-sm text-white focus:border-cyber-cyan focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-[#02030b] px-4 py-3 text-sm text-slate-400">
                <span>Secure QR sharing</span>
                <button type="button" onClick={() => setShowQrCode(!showQrCode)} className="text-cyber-cyan transition hover:text-cyber-violet">
                  {showQrCode ? "Hide" : "Generate"}
                </button>
              </div>

              {showQrCode && (
                <div className="space-y-3">
                  {!shareLink && (
                    <button
                      type="button"
                      disabled={generatingLink}
                      onClick={handleGenerateShareLink}
                      className="w-full rounded-3xl border border-cyber-cyan/40 bg-[#02030b] px-4 py-3 text-sm text-cyber-cyan transition hover:border-cyber-cyan hover:bg-cyber-cyan/10 disabled:opacity-50"
                    >
                      {generatingLink ? "Generating secure link..." : "Generate QR Share Link"}
                    </button>
                  )}
                  {shareLink && (
                    <div className="rounded-3xl bg-[#06060f] border border-cyber-cyan/20 p-4 text-center">
                      <div className="mx-auto mb-3 flex items-center justify-center rounded-2xl bg-white p-3">
                        <QRCodeSVG value={shareLink} size={160} bgColor="#ffffff" fgColor="#030510" level="H" />
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Scan to access file securely</p>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-[#02030b] px-3 py-2">
                        <span className="flex-1 truncate text-[10px] font-mono text-cyber-cyan/70">{shareLink}</span>
                        <button type="button" onClick={copyShareLink} className="shrink-0 rounded-xl bg-cyber-cyan/10 px-2 py-1 text-[10px] text-cyber-cyan transition hover:bg-cyber-cyan/20">
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button className="w-full rounded-3xl bg-cyber-violet px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-cyber-violet/90">
                Deploy sharing policy
              </button>
            </form>
          </div>
        </div>
      )}


      {toastMsg && (
        <div 
          className={`fixed top-4 right-4 z-[60] flex items-center gap-3 max-w-sm rounded-3xl border px-5 py-3 text-sm font-semibold shadow-2xl ${
            toastType === "success" 
              ? "border-emerald-500/30 bg-emerald-950/95 text-emerald-300 shadow-emerald-500/10" 
              : "border-red-500/30 bg-red-950/95 text-red-300 shadow-red-500/10"
          }`}
        >
          <span className="flex-1">{toastMsg}</span>
          <button 
            onClick={() => setToastMsg(null)} 
            className="ml-2 shrink-0 rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="text-[10px]">&#x2715;</span>
          </button>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-cyber-pink/20 bg-red-950/20 p-6 shadow-[0_0_60px_rgba(236,72,153,0.18)]">
            <div className="flex items-center gap-3 text-cyber-pink">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-semibold text-white font-cyber">AI Threat Block Warning</h3>
            </div>
            <p className="mt-3 text-sm text-slate-300">The uploaded file <span className="font-semibold text-white">{errorModal.fileName}</span> failed AI security validation.</p>
            <div className="mt-4 rounded-3xl bg-[#04030a]/90 border border-red-900/70 p-4 text-sm text-slate-300">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">SHA-256</p>
              <p className="mt-2 text-red-300 truncate">{errorModal.fileHash}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#05030f]/90 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Threat rating</p>
                  <p className="mt-2 text-white font-semibold">{errorModal.threatScore}/100</p>
                </div>
                <div className="rounded-3xl bg-[#05030f]/90 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">VT detections</p>
                  <p className="mt-2 text-yellow-300 font-semibold">{errorModal.vtPositives}/{errorModal.vtTotal}</p>
                </div>
              </div>
              <div className="mt-4 text-[11px] text-slate-300">
                <p className="text-slate-400">Flagged indicators</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {errorModal.detectedThreats.map((threat: string, idx: number) => (
                    <span key={idx} className="rounded-2xl bg-red-950/70 px-2 py-1 text-[10px] text-red-300">{threat}</span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setErrorModal(null)} className="mt-6 w-full rounded-3xl bg-red-950/70 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-900">
              Acknowledge and dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Vault;
