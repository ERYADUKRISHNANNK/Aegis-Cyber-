import { pipeline, env } from "@xenova/transformers";

// Allow model downloads from HuggingFace CDN
env.allowLocalModels = false;
env.allowRemoteModels = true;

// Use optimal thread count for client CPU
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;

let generator: any = null;
let embedder: any = null;
let currentModel: string = "";

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, data } = event.data;

  // 1. Load Text Generation Model
  if (type === "load") {
    const { modelName } = data;
    if (generator && currentModel === modelName) {
      self.postMessage({ status: "ready", modelName });
      return;
    }

    try {
      self.postMessage({ status: "loading", message: `Initializing ${modelName}...` });

      const task = "text-generation";

      generator = await pipeline(task, modelName, {
        progress_callback: (progressData: any) => {
          if (progressData.status === "progress") {
            self.postMessage({
              status: "progress",
              file: progressData.file,
              progress: progressData.progress,
              loaded: progressData.loaded,
              total: progressData.total,
            });
          }
        },
      });

      currentModel = modelName;
      self.postMessage({ status: "ready", modelName });
    } catch (err: any) {
      self.postMessage({ status: "error", error: err.message || "Failed to load model" });
    }
  }

  // 2. Load Embeddings Model
  if (type === "load_embeddings") {
    if (embedder) {
      self.postMessage({ status: "embeddings_ready" });
      return;
    }

    try {
      self.postMessage({ status: "embeddings_loading", message: "Initializing local RAG embedding engine..." });

      embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        progress_callback: (progressData: any) => {
          if (progressData.status === "progress") {
            self.postMessage({
              status: "embeddings_progress",
              file: progressData.file,
              progress: progressData.progress,
              loaded: progressData.loaded,
              total: progressData.total,
            });
          }
        },
      });

      self.postMessage({ status: "embeddings_ready" });
    } catch (err: any) {
      self.postMessage({ status: "embeddings_error", error: err.message || "Failed to load embeddings model" });
    }
  }

  // 3. Generate Vector Embeddings for Chunks
  if (type === "embed") {
    if (!embedder) {
      self.postMessage({ status: "embeddings_error", error: "Embeddings model has not been initialized" });
      return;
    }

    try {
      const { chunks } = data;
      const embeddings: number[][] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const output = await embedder(chunk, { pooling: "mean", normalize: true });
        
        // Convert Float32Array to standard array
        const vector = Array.from(output.data) as number[];
        embeddings.push(vector);

        // Update progress back to main thread
        self.postMessage({
          status: "embed_progress",
          current: i + 1,
          total: chunks.length,
          percentage: Math.round(((i + 1) / chunks.length) * 100)
        });
      }

      self.postMessage({ status: "embed_completed", embeddings });
    } catch (err: any) {
      self.postMessage({ status: "embeddings_error", error: err.message || "Inference error during embedding calculation" });
    }
  }

  // 4. Generate Text Response
  if (type === "generate") {
    if (!generator) {
      self.postMessage({ status: "error", error: "Model has not been initialized yet" });
      return;
    }

    try {
      const { text, max_new_tokens, temperature } = data;

      const response = await generator(text, {
        max_new_tokens: max_new_tokens || 128,
        temperature: temperature || 0.7,
        do_sample: (temperature || 0.7) > 0,
      });

      const rawOutput = response[0].generated_text;

      // Universally strip the original prompt if it is prepended to the output
      const outputText = rawOutput.startsWith(text) ? rawOutput.substring(text.length) : rawOutput;

      self.postMessage({ status: "completed", output: outputText.trim() });
    } catch (err: any) {
      self.postMessage({ status: "error", error: err.message || "Inference error" });
    }
  }
});
