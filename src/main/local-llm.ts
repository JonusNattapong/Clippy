import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

let currentModel: any | null = null;
let currentContext: any | null = null;
let currentSession: any | null = null;
let currentModelName: string = "";

const MODELS_DIR = path.join(app.getPath("userData"), "models");

export interface LocalModelInfo {
  name: string;
  filename: string;
  size: number;
  downloadedAt: number;
}

export function ensureModelsDirectory(): void {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }
}

export function getModelsDirectory(): string {
  ensureModelsDirectory();
  return MODELS_DIR;
}

export function listLocalModels(): LocalModelInfo[] {
  ensureModelsDirectory();

  const files = fs.readdirSync(MODELS_DIR);
  const models: LocalModelInfo[] = [];

  for (const file of files) {
    if (file.endsWith(".gguf")) {
      const filePath = path.join(MODELS_DIR, file);
      const stats = fs.statSync(filePath);
      models.push({
        name: file.replace(".gguf", ""),
        filename: file,
        size: stats.size,
        downloadedAt: stats.mtimeMs,
      });
    }
  }

  return models.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export function findModelPath(modelName: string): string | null {
  ensureModelsDirectory();

  // Try exact match first
  const exactPath = path.join(MODELS_DIR, `${modelName}.gguf`);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  // Try with .gguf extension
  const withExtPath = path.join(MODELS_DIR, modelName);
  if (fs.existsSync(withExtPath) && withExtPath.endsWith(".gguf")) {
    return withExtPath;
  }

  // Search for partial match
  const files = fs.readdirSync(MODELS_DIR);
  const lowerName = modelName.toLowerCase();

  for (const file of files) {
    if (file.endsWith(".gguf") && file.toLowerCase().includes(lowerName)) {
      return path.join(MODELS_DIR, file);
    }
  }

  return null;
}

export async function loadModel(modelName: string): Promise<void> {
  const modelPath = findModelPath(modelName);

  if (!modelPath) {
    throw new Error(
      `Model "${modelName}" not found in ${MODELS_DIR}. Please download a GGUF model and place it in the models directory.`,
    );
  }

  // Unload current model if different
  if (currentModelName !== modelName) {
    await unloadModel();
  }

  try {
    // Dynamic import to avoid top-level await issues
    const { getLlama, LlamaChatSession } = await import("node-llama-cpp");

    const llama = await getLlama();
    currentModel = await llama.loadModel({
      modelPath: modelPath,
    });

    currentContext = await currentModel.createContext({
      contextSize: 4096,
    });

    currentSession = new LlamaChatSession({
      contextSequence: currentContext.getSequence(),
    });

    currentModelName = modelName;
    console.log(`[Local LLM] Loaded model: ${modelName}`);
  } catch (error) {
    currentModel = null;
    currentContext = null;
    currentSession = null;
    currentModelName = "";
    throw new Error(`Failed to load model "${modelName}": ${error}`);
  }
}

export async function unloadModel(): Promise<void> {
  if (currentSession) {
    currentSession.dispose();
    currentSession = null;
  }
  if (currentContext) {
    currentContext.dispose();
    currentContext = null;
  }
  if (currentModel) {
    currentModel.dispose();
    currentModel = null;
  }
  currentModelName = "";
  console.log("[Local LLM] Model unloaded");
}

export function isModelLoaded(): boolean {
  return currentSession !== null && currentModel !== null;
}

export function getCurrentModelName(): string {
  return currentModelName;
}

export async function* generateText(
  prompt: string,
  options: {
    temperature?: number;
    topK?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  } = {},
): AsyncGenerator<string, void, undefined> {
  if (!currentSession) {
    throw new Error("No model loaded. Please load a model first.");
  }

  const { temperature = 0.7, topK = 40, maxTokens = 1024, signal } = options;

  try {
    let aborted = false;

    if (signal) {
      signal.addEventListener("abort", () => {
        aborted = true;
      });
    }

    const response = await currentSession.prompt(prompt, {
      temperature,
      topK,
      maxTokens,
      onToken: (_tokens: any) => {
        if (aborted) {
          return false; // Stop generation
        }
        return true; // Continue generation
      },
    });

    // For now, yield the complete response
    // TODO: Implement true streaming when node-llama-cpp supports it better
    if (response && !aborted) {
      yield response;
    }
  } catch (error) {
    if (signal?.aborted) {
      return; // Generation was aborted
    }
    throw error;
  }
}

export function getRecommendedModels(): Array<{
  name: string;
  filename: string;
  url: string;
  description: string;
  size: string;
}> {
  return [
    {
      name: "Llama 3.2 3B",
      filename: "llama-3.2-3b-instruct.Q4_K_M.gguf",
      url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
      description: "Small, fast, good for general chat",
      size: "2.0 GB",
    },
    {
      name: "Llama 3.1 8B",
      filename: "llama-3.1-8b-instruct.Q4_K_M.gguf",
      url: "https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
      description: "Balanced performance and quality",
      size: "4.7 GB",
    },
    {
      name: "Qwen 2.5 7B",
      filename: "qwen2.5-7b-instruct.Q4_K_M.gguf",
      url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf",
      description: "Good for Thai language",
      size: "4.4 GB",
    },
    {
      name: "Gemma 2 9B",
      filename: "gemma-2-9b-it.Q4_K_M.gguf",
      url: "https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf",
      description: "Google's model, good quality",
      size: "5.4 GB",
    },
    {
      name: "Phi-3.5 Mini",
      filename: "Phi-3.5-mini-instruct.Q4_K_M.gguf",
      url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf",
      description: "Microsoft's small but capable model",
      size: "2.2 GB",
    },
  ];
}

export async function downloadModel(
  url: string,
  filename: string,
  onProgress?: (progress: {
    percent: number;
    downloaded: number;
    total: number;
  }) => void,
): Promise<string> {
  ensureModelsDirectory();

  const filePath = path.join(MODELS_DIR, filename);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`);
  }

  const total = parseInt(response.headers.get("content-length") || "0", 10);
  let downloaded = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  const chunks: Uint8Array[] = [];

  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    const value = result.value;

    if (done || !value) {
      break;
    }

    chunks.push(value);
    downloaded += value.length;

    if (onProgress && total > 0) {
      onProgress({
        percent: Math.round((downloaded / total) * 100),
        downloaded,
        total,
      });
    }
  }

  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}
