import { pipeline, env } from "@xenova/transformers";

// Allow model downloads from HuggingFace CDN
env.allowLocalModels = false;
env.allowRemoteModels = true;
// Use HuggingFace CDN (avoids CORS issues)
env.backends.onnx.wasm.numThreads = 1;

let generator: any = null;
let currentModel: string = "";

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, data } = event.data;

  if (type === "load") {
    const { modelName } = data;
    if (generator && currentModel === modelName) {
      self.postMessage({ status: "ready", modelName });
      return;
    }

    try {
      self.postMessage({ status: "loading", message: `Initializing ${modelName}...` });

      // All models now use text-generation
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

  if (type === "generate") {
    if (!generator) {
      self.postMessage({ status: "error", error: "Model has not been initialized yet" });
      return;
    }

    try {
      const { text, max_new_tokens, temperature } = data;

      let outputText = "";
      if (currentModel.includes("Qwen")) {
        // Qwen model uses auto-regressive text-generation with prompt formatting
        const response = await generator(text, {
          max_new_tokens: max_new_tokens || 128,
          temperature: temperature || 0.7,
          do_sample: (temperature || 0.7) > 0,
        });
        
        // Extract output text
        const rawOutput = response[0].generated_text;
        // Strip the prompt from output if needed
        outputText = rawOutput.startsWith(text) ? rawOutput.substring(text.length) : rawOutput;
      } else {
        // LaMini-Flan-T5 uses text2text-generation
        const response = await generator(text, {
          max_new_tokens: max_new_tokens || 128,
          temperature: temperature || 0.7,
          do_sample: (temperature || 0.7) > 0,
        });
        outputText = response[0].generated_text;
      }

      self.postMessage({ status: "completed", output: outputText.trim() });
    } catch (err: any) {
      self.postMessage({ status: "error", error: err.message || "Inference error" });
    }
  }
});
