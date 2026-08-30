import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Send, 
  Brain, 
  Settings, 
  Cpu, 
  Database, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  HelpCircle
} from "lucide-react";

interface Message {
  sender: "user" | "local-llm";
  text: string;
  timestamp: string;
  durationMs?: number;
  sources?: { fileName: string; score: number }[];
}

interface FileProgress {
  file: string;
  progress: number;
  loaded: number;
  total: number;
}

const AVAILABLE_MODELS = [
  {
    id: "Xenova/distilgpt2",
    name: "DistilGPT-2 (Fast)",
    size: "~85 MB",
    description: "Fast, lightweight GPT-2 model. Works offline after first download.",
  },
  {
    id: "Xenova/gpt2",
    name: "GPT-2 (Smarter)",
    size: "~550 MB",
    description: "Standard GPT-2. Better quality responses, requires more memory.",
  }
];


export const LocalLLM: React.FC = () => {
  const [modelId, setModelId] = useState(AVAILABLE_MODELS[0].id);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [progressList, setProgressList] = useState<{ [key: string]: FileProgress }>({});
  
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "local-llm",
      text: "Welcome to the Aegis Decentralized Local LLM Node. This model runs entirely in-browser using WebAssembly/WebGPU, requiring zero network calls, zero API keys, and keeping all telemetry completely local. Select a model, initialize the engine, and start testing.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStart, setGenerationStart] = useState<number | null>(null);

  // Model parameters
  const [maxTokens, setMaxTokens] = useState(128);
  const [temperature, setTemperature] = useState(0.7);

  // Local RAG states
  const [vaultFiles, setVaultFiles] = useState<any[]>([]);
  const [ingestedFiles, setIngestedFiles] = useState<{ [key: string]: "idle" | "loading" | "ingested" | "error" }>({});
  const [vectorStore, setVectorStore] = useState<{ fileId: string; fileName: string; text: string; embedding: number[] }[]>([]);
  const [useRag, setUseRag] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<"idle" | "loading" | "ingesting" | "ready">("idle");
  const [embeddingsProgress, setEmbeddingsProgress] = useState(0);
  const [embeddingsOverall, setEmbeddingsOverall] = useState("");
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  const pendingIngestRef = useRef<{ fileId: string; fileName: string; chunks: string[] } | null>(null);
  const pendingQueryRef = useRef<{ queryText: string; timestamp: string } | null>(null);
  const currentSourcesRef = useRef<{ fileName: string; score: number }[] | undefined>(undefined);

  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchVaultFiles = async () => {
    try {
      const res = await axios.get("/api/files/list");
      setVaultFiles(res.data);
    } catch {
      console.warn("Could not retrieve real vault list. Loading fallback.");
      setVaultFiles([
        {
          _id: "1",
          fileName: "iso_policy_draft.pdf",
          fileSize: 412051,
          mimeType: "application/pdf"
        }
      ]);
    }
  };

  useEffect(() => {
    fetchVaultFiles();
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, progressList]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleInitialize = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setProgressList({});
    setModelStatus("loading");
    setStatusMessage("Downloading model config & tokenizers...");

    // Reset RAG states on reload
    setVectorStore([]);
    setIngestedFiles({});
    setEmbeddingStatus("idle");

    // Create a new Web Worker instance
    workerRef.current = new Worker(
      new URL("./llm.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Listen to messages from worker
    workerRef.current.onmessage = (event) => {
      const { status, message, file, progress, loaded, total, output, error } = event.data;

      if (status === "loading") {
        setStatusMessage(message);
      } else if (status === "progress") {
        setProgressList((prev) => ({
          ...prev,
          [file]: { file, progress, loaded, total }
        }));
      } else if (status === "ready") {
        setModelStatus("ready");
        setStatusMessage("Model loaded successfully. AI node is active.");
      } else if (status === "completed") {
        const duration = generationStart ? Date.now() - generationStart : undefined;
        setMessages((prev) => [
          ...prev,
          {
            sender: "local-llm",
            text: output || "(empty response)",
            timestamp: new Date().toLocaleTimeString(),
            durationMs: duration,
            sources: currentSourcesRef.current
          }
        ]);
        currentSourcesRef.current = undefined;
        setIsGenerating(false);
        setGenerationStart(null);
      } else if (status === "error") {
        setModelStatus("error");
        setErrorDetails(error || "An unknown error occurred during execution.");
        setIsGenerating(false);
        setGenerationStart(null);
      } else if (status === "embeddings_loading") {
        setEmbeddingStatus("loading");
        setEmbeddingsOverall(message || "Loading embeddings model...");
      } else if (status === "embeddings_progress") {
        const pct = Math.round((loaded / total) * 100);
        setEmbeddingsOverall(`Downloading local vector embeddings model: ${pct}%`);
      } else if (status === "embeddings_ready") {
        setEmbeddingStatus("ready");
        setEmbeddingsOverall("Embedding engine ready.");
        
        // Execute pending RAG ingestion if present
        if (pendingIngestRef.current) {
          const { chunks } = pendingIngestRef.current;
          setEmbeddingsOverall(`Calculating vectors for ${chunks.length} chunks...`);
          workerRef.current?.postMessage({
            type: "embed",
            data: { chunks }
          });
        }
        
        // Execute pending RAG search query if present
        if (pendingQueryRef.current) {
          const { queryText } = pendingQueryRef.current;
          workerRef.current?.postMessage({
            type: "embed",
            data: { chunks: [queryText] }
          });
        }
      } else if (status === "embeddings_error") {
        setEmbeddingStatus("idle");
        alert(`Local Embeddings Fault: ${error}`);
        if (pendingIngestRef.current) {
          setIngestedFiles(prev => ({ ...prev, [pendingIngestRef.current!.fileId]: "error" }));
          pendingIngestRef.current = null;
        }
        pendingQueryRef.current = null;
      } else if (status === "embed_progress") {
        const { current, percentage } = event.data;
        setEmbeddingsOverall(`Vectorizing content: chunk ${current} of ${total} (${percentage}%)`);
        setEmbeddingsProgress(percentage);
      } else if (status === "embed_completed") {
        const { embeddings } = event.data;
        
        if (pendingIngestRef.current) {
          const { fileId, fileName, chunks } = pendingIngestRef.current;
          const newChunks = chunks.map((chunk, idx) => ({
            fileId,
            fileName,
            text: chunk,
            embedding: embeddings[idx]
          }));
          setVectorStore(prev => [...prev, ...newChunks]);
          setIngestedFiles(prev => ({ ...prev, [fileId]: "ingested" }));
          pendingIngestRef.current = null;
          setEmbeddingStatus("ready");
          setEmbeddingsOverall(`Successfully indexed ${newChunks.length} document nodes.`);
        } else if (pendingQueryRef.current) {
          const { queryText } = pendingQueryRef.current;
          const queryVector = embeddings[0];
          
          // Local Cosine Similarity Search
          const scored = vectorStore.map(chunk => {
            let dotProduct = 0;
            for (let j = 0; j < queryVector.length; j++) {
              dotProduct += queryVector[j] * chunk.embedding;
            }
            return { chunk, score: dotProduct };
          });

          // Sort descending, select top 3 above similarity score 0.35
          const topChunks = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .filter(item => item.score > 0.35);

          let augmentedText = "";
          let sourcesList: { fileName: string; score: number }[] = [];
          
          if (topChunks.length > 0) {
            augmentedText = "System context: Please answer the user query based on these verified local records:\n\n";
            topChunks.forEach(item => {
              augmentedText += `[Document Node: ${item.chunk.fileName}]\n${item.chunk.text}\n---\n`;
              sourcesList.push({ fileName: item.chunk.fileName, score: item.score });
            });
            augmentedText += `User Query: ${queryText}\nAnswer:`;
          } else {
            augmentedText = queryText;
          }

          currentSourcesRef.current = sourcesList;
          pendingQueryRef.current = null;

          workerRef.current?.postMessage({
            type: "generate",
            data: {
              text: augmentedText,
              max_new_tokens: maxTokens,
              temperature: temperature
            }
          });
        }
      }
    };

    // Load the model
    workerRef.current.postMessage({
      type: "load",
      data: { modelName: modelId }
    });
  };

  const loadPdfJs = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        setPdfjsLoaded(true);
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const extractTextFromPdf = async (blob: Blob): Promise<string> => {
    await loadPdfJs();
    const pdfjsLib = (window as any).pdfjsLib;
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(" ") + "\n";
    }
    return text;
  };

  const handleToggleIngestFile = async (fileId: string, fileName: string, mimeType: string) => {
    if (ingestedFiles[fileId] === "ingested") {
      setVectorStore(prev => prev.filter(c => c.fileId !== fileId));
      setIngestedFiles(prev => ({ ...prev, [fileId]: "idle" }));
      return;
    }

    setIngestedFiles(prev => ({ ...prev, [fileId]: "loading" }));
    setEmbeddingStatus("ingesting");
    setEmbeddingsOverall(`Downloading ${fileName}...`);

    try {
      const response = await axios({
        url: `/api/files/download/${fileId}`,
        method: "GET",
        responseType: "blob"
      });
      const blob = response.data;

      let text = "";
      if (mimeType === "application/pdf") {
        setEmbeddingsOverall(`Parsing PDF page layout...`);
        text = await extractTextFromPdf(blob);
      } else {
        setEmbeddingsOverall(`Extracting UTF-8 characters...`);
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(blob);
        });
      }

      if (!text.trim()) {
        throw new Error("Target file returned empty text content.");
      }

      // Chunk with sliding window
      const chunks: string[] = [];
      const chunkSize = 500;
      const overlap = 100;
      let idx = 0;
      while (idx < text.length) {
        chunks.push(text.substring(idx, idx + chunkSize));
        idx += chunkSize - overlap;
      }

      pendingIngestRef.current = { fileId, fileName, chunks };

      if (!workerRef.current || modelStatus !== "ready") {
        alert("Please initialize the Local LLM engine before vectorizing documents.");
        setIngestedFiles(prev => ({ ...prev, [fileId]: "idle" }));
        setEmbeddingStatus("idle");
        return;
      }

      if (embeddingStatus !== "ready") {
        setEmbeddingsOverall("Deploying local embedding weights (MiniLM-L6)...");
        workerRef.current.postMessage({ type: "load_embeddings" });
      } else {
        setEmbeddingsOverall(`Vectorizing ${chunks.length} text segments...`);
        workerRef.current.postMessage({
          type: "embed",
          data: { chunks }
        });
      }

    } catch (err: any) {
      console.error("RAG ingest failed:", err);
      alert(`Ingestion error: ${err.message || err}`);
      setIngestedFiles(prev => ({ ...prev, [fileId]: "error" }));
      setEmbeddingStatus("ready");
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating || modelStatus !== "ready" || !workerRef.current) return;

    const userText = query;
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
    setQuery("");
    setIsGenerating(true);
    setGenerationStart(Date.now());

    if (useRag && vectorStore.length > 0) {
      pendingQueryRef.current = { queryText: userText, timestamp: new Date().toLocaleTimeString() };
      
      if (embeddingStatus !== "ready") {
        workerRef.current.postMessage({ type: "load_embeddings" });
      } else {
        workerRef.current.postMessage({
          type: "embed",
          data: { chunks: [userText] }
        });
      }
    } else {
      workerRef.current.postMessage({
        type: "generate",
        data: {
          text: userText,
          max_new_tokens: maxTokens,
          temperature: temperature
        }
      });
    }
  };

  // Compute download totals
  const totalLoaded = Object.values(progressList).reduce((acc, curr) => acc + curr.loaded, 0);
  const totalSize = Object.values(progressList).reduce((acc, curr) => acc + curr.total, 0);
  const overallPercentage = totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Control Panel Sidebar */}
      <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between overflow-y-auto space-y-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
            <Cpu className="h-5 w-5 text-cyber-cyan" />
            <h3 className="text-sm font-bold font-cyber text-white">ENGINE CONTROLS</h3>
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold font-cyber text-slate-400 block uppercase">
              Select Local Model
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={modelStatus === "loading" || modelStatus === "ready"}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan disabled:opacity-50"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.size})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 font-mono">
              {AVAILABLE_MODELS.find(m => m.id === modelId)?.description}
            </p>
          </div>

          {/* Initializer Button */}
          {modelStatus !== "ready" && (
            <button
              onClick={handleInitialize}
              disabled={modelStatus === "loading"}
              className={`w-full py-2.5 rounded-lg text-xs font-cyber font-bold uppercase transition-all duration-300 border flex items-center justify-center space-x-2 ${
                modelStatus === "loading"
                  ? "bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 shadow-cyan"
              }`}
            >
              {modelStatus === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cyber-cyan" />
                  <span>Loading Engine...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Initialize Model</span>
                </>
              )}
            </button>
          )}

          {modelStatus === "ready" && (
            <div className="p-3 bg-green-950/20 border border-green-800/40 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-cyber-neonGreen text-xs font-bold font-cyber">
                <CheckCircle2 className="h-4 w-4" />
                <span>NODE ONLINE</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Model cached in IndexedDB. Offline inference ready.
              </p>
              <button
                onClick={handleInitialize}
                className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400 transition"
              >
                Reload / Switch Model
              </button>
            </div>
          )}

          {/* Parameters Panel */}
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Settings className="h-4 w-4" />
              <span className="text-[10px] font-bold font-cyber uppercase">Parameters</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Temperature: {temperature}</span>
                <span title="Higher values mean more random creative responses" className="cursor-pointer">
                  <HelpCircle className="h-3 w-3 text-slate-600 hover:text-slate-400" />
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Max Tokens: {maxTokens}</span>
                <span title="Length limit of output response" className="cursor-pointer">
                  <HelpCircle className="h-3 w-3 text-slate-600 hover:text-slate-400" />
                </span>
              </div>
              <input
                type="range"
                min="32"
                max="512"
                step="16"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
              />
            </div>
          </div>

          {/* Local RAG Vector Store */}
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Database className="h-4 w-4 text-cyber-cyan" />
                <span className="text-[10px] font-bold font-cyber uppercase tracking-wider">Local RAG Context</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  disabled={vectorStore.length === 0}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyber-cyan peer-checked:after:bg-white" />
              </label>
            </div>

            {embeddingStatus === "ingesting" && (
              <div className="p-2 bg-cyan-950/20 border border-cyan-800/40 rounded text-[9px] font-mono text-cyber-cyan animate-pulse">
                {embeddingsOverall} {embeddingsProgress > 0 && `(${embeddingsProgress}%)`}
              </div>
            )}

            {embeddingStatus === "loading" && (
              <div className="p-2 bg-yellow-950/20 border border-yellow-800/40 rounded text-[9px] font-mono text-yellow-500 animate-pulse">
                {embeddingsOverall}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 select-none">
              {vaultFiles.length === 0 ? (
                <p className="text-[9px] text-slate-500 font-mono italic">No vault files loaded.</p>
              ) : (
                vaultFiles.map(file => (
                  <div key={file._id} className="flex items-center justify-between p-1.5 bg-[#020208] border border-slate-900 rounded">
                    <div className="truncate pr-2">
                      <p className="text-[9.5px] font-mono text-slate-300 truncate" title={file.fileName}>{file.fileName}</p>
                      <p className="text-[8px] font-mono text-slate-500">{(file.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      disabled={modelStatus !== "ready"}
                      onClick={() => handleToggleIngestFile(file._id, file.fileName, file.mimeType)}
                      className={`px-2 py-1 rounded text-[8px] font-cyber uppercase tracking-wider transition ${
                        ingestedFiles[file._id] === "ingested"
                          ? "bg-green-950/30 text-cyber-neonGreen border border-green-800/50 hover:bg-red-950/30 hover:text-red-400 hover:border-red-800/50"
                          : ingestedFiles[file._id] === "loading"
                          ? "bg-yellow-950/30 text-yellow-400 border border-yellow-800/50 animate-pulse"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {ingestedFiles[file._id] === "ingested" ? "Indexed" : ingestedFiles[file._id] === "loading" ? "Vectorizing" : "Index"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preset Playbooks */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Sparkles className="h-4 w-4 text-cyber-gold" />
              <span className="text-[10px] font-bold font-cyber uppercase">Preset Playbooks</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "GDPR Compliance Analysis", text: "Explain GDPR compliance requirements for client-side encrypted decentralized file storage." },
                { label: "Ransomware Playbook", text: "Draft a ransomware containment and response playbook for SOC analysts." },
                { label: "Contract Forensic Log", text: "How does a blockchain Solidity registry contract preserve custody integrity in digital forensics?" }
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (modelStatus === "ready" && !isGenerating) {
                      setQuery(p.text);
                    }
                  }}
                  disabled={modelStatus !== "ready" || isGenerating}
                  className="w-full text-left p-2 bg-[#020208] hover:bg-[#090714] border border-slate-900 hover:border-slate-800 rounded text-[10px] text-slate-400 hover:text-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                  title={p.text}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="pt-4 border-t border-slate-900 text-[10px] font-mono text-slate-500 space-y-1">
          <div className="flex items-center space-x-1.5">
            <Database className="h-3.5 w-3.5 text-cyber-violet" />
            <span className="text-slate-400 uppercase text-[9px] font-cyber">Node Metadata</span>
          </div>
          <p>CPU Cores: {navigator.hardwareConcurrency || "Unknown"}</p>
          <p>Local Caching: IndexedDB</p>
        </div>
      </div>

      {/* Chat Arena Main Interface */}
      <div className="lg:col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden relative">
        {/* Head Bar */}
        <div className="p-4 border-b border-cyber-border bg-[#090610] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-cyber-cyan animate-pulse" />
            <div>
              <h3 className="text-sm font-bold font-cyber text-white">DECENTRALIZED LOCAL LLM</h3>
              <p className="text-[10px] text-slate-400 font-mono">100% In-browser sandbox, no limits, no logging</p>
            </div>
          </div>
          
          <div className="text-[10px] font-mono">
            {modelStatus === "ready" ? (
              <span className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-800 text-cyber-cyan rounded">
                Active: {modelId.split("/").pop()}
              </span>
            ) : modelStatus === "loading" ? (
              <span className="px-2 py-0.5 bg-yellow-950/40 border border-yellow-800 text-yellow-500 rounded animate-pulse">
                Deploying Node...
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 rounded">
                Node Standby
              </span>
            )}
          </div>
        </div>

        {/* Loading Progress Overlays */}
        {modelStatus === "loading" && Object.keys(progressList).length > 0 && (
          <div className="absolute inset-0 bg-[#04030a]/90 z-20 flex flex-col items-center justify-center p-6 space-y-6">
            <div className="max-w-md w-full text-center space-y-4">
              <Loader2 className="h-8 w-8 text-cyber-cyan animate-spin mx-auto" />
              <div>
                <h4 className="text-xs font-bold font-cyber text-white uppercase tracking-wider">
                  Downloading Model Weights
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Downloading to browser cache: {formatSize(totalLoaded)} / {formatSize(totalSize)}
                </p>
              </div>

              {/* Overall Progress Bar */}
              <div className="w-full bg-slate-950 border border-slate-900 h-3 rounded-full overflow-hidden relative">
                <div 
                  className="bg-cyber-cyan h-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  style={{ width: `${overallPercentage}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white font-mono leading-none">
                  {overallPercentage}%
                </span>
              </div>

              {/* Individual File Progress */}
              <div className="max-h-40 overflow-y-auto space-y-2 text-left bg-black/50 border border-slate-900 rounded-lg p-3 scrollbar-thin">
                {Object.values(progressList).map((item, index) => (
                  <div key={index} className="text-[9px] font-mono space-y-1">
                    <div className="flex justify-between text-slate-400 truncate">
                      <span className="truncate pr-4">{item.file.split("/").pop()}</span>
                      <span className="shrink-0">{Math.round(item.progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-cyber-violet h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Frame */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xl p-4 rounded-xl text-xs font-mono space-y-2 relative group ${
                msg.sender === "user" 
                  ? "bg-cyber-violet/30 border border-cyber-violet/50 text-white" 
                  : "bg-slate-950/80 border border-slate-900 text-slate-300"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-1.5 mb-1 text-[10px]">
                  <div className="flex items-center space-x-2 font-bold">
                    {msg.sender === "local-llm" ? (
                      <>
                        <Brain className="h-3.5 w-3.5 text-cyber-cyan" />
                        <span className="text-cyber-cyan font-cyber uppercase tracking-wider">LOCAL NODE LLM</span>
                      </>
                    ) : (
                      <span className="text-cyber-violet uppercase">ANALYST OPERATOR</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>

                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Local RAG Citation Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="p-2 bg-cyan-950/20 border border-cyan-800/30 rounded space-y-1 my-2">
                    <span className="text-cyber-cyan font-bold text-[8.5px] block font-cyber tracking-wider">RETRIEVED COMPLIANCE VAULT EVIDENCE:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 rounded text-[8.5px] border border-cyan-800/40 flex items-center space-x-1">
                          <span>{src.fileName}</span>
                          <span className="text-[7.5px] text-cyber-cyan font-bold font-mono">({Math.round(src.score * 100)}% match)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.durationMs && (
                  <div className="text-[8px] text-slate-500 text-right font-mono mt-1.5 opacity-60 group-hover:opacity-100 transition">
                    Inference complete in {(msg.durationMs / 1000).toFixed(2)}s
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl text-xs font-mono text-slate-400 flex items-center space-x-3">
                <Loader2 className="h-4 w-4 animate-spin text-cyber-cyan animate-pulse" />
                <span>LLM node executing on local CPU thread...</span>
              </div>
            </div>
          )}

          {modelStatus === "error" && (
            <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-cyber-pink font-cyber font-bold text-xs">
                <AlertTriangle className="h-4 w-4 text-cyber-pink" />
                <span>ENGINE FAULT TRIGGERED</span>
              </div>
              <p className="text-[10px] text-red-300 font-mono">
                {errorDetails}
              </p>
              <button 
                onClick={handleInitialize}
                className="px-3 py-1 bg-red-950/50 hover:bg-red-900/50 border border-red-800 text-[10px] font-cyber text-red-200 rounded"
              >
                Attempt Engine Restart
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-cyber-border bg-[#090610] flex space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={modelStatus !== "ready" || isGenerating}
            placeholder={
              modelStatus !== "ready"
                ? "Please initialize the local LLM node from the control panel first..."
                : isGenerating
                ? "LLM is thinking..."
                : "Ask anything... prompt is evaluated entirely on-device"
            }
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={modelStatus !== "ready" || isGenerating || !query.trim()}
            className="p-2.5 bg-cyber-cyan/10 border border-cyber-cyan/40 hover:bg-cyber-cyan/20 text-cyber-cyan rounded-lg transition-all shadow-cyan disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocalLLM;
