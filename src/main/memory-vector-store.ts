import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

import { Memory } from "../types/interfaces";

type VectorEntry = {
  embedding: number[];
  updatedAt: number;
  signature: string;
};

type VectorIndexFile = {
  entries: Record<string, VectorEntry>;
};

type FeatureExtractionPipeline = Awaited<
  ReturnType<typeof pipeline<"feature-extraction">>
>;

export class MemoryVectorStore {
  private indexPath = path.join(
    app.getPath("userData"),
    "memories",
    "vector-index.json",
  );
  private entries: Record<string, VectorEntry> = this.loadFromDisk().entries;
  private extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

  constructor() {
    env.cacheDir = path.join(app.getPath("userData"), "models");
    env.allowLocalModels = true;
  }

  public async findRelevantMemories(
    query: string,
    memories: Memory[],
    limit: number = 6,
  ): Promise<Array<{ memoryId: string; score: number }>> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || memories.length === 0) {
      return [];
    }

    await this.ensureMemoryEmbeddings(memories);
    const queryEmbedding = await this.embedText(normalizedQuery);

    const scored = memories
      .map((memory) => {
        const entry = this.entries[memory.id];
        if (!entry?.embedding?.length) {
          return null;
        }

        return {
          memoryId: memory.id,
          score: cosineSimilarity(queryEmbedding, entry.embedding),
        };
      })
      .filter(
        (entry): entry is { memoryId: string; score: number } =>
          entry !== null && Number.isFinite(entry.score),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  public async ensureMemoryEmbeddings(memories: Memory[]): Promise<void> {
    let changed = false;
    const currentIds = new Set(memories.map((memory) => memory.id));

    for (const memoryId of Object.keys(this.entries)) {
      if (!currentIds.has(memoryId)) {
        delete this.entries[memoryId];
        changed = true;
      }
    }

    for (const memory of memories) {
      const signature = buildMemorySignature(memory);
      const existing = this.entries[memory.id];

      if (existing && existing.signature === signature) {
        continue;
      }

      const embedding = await this.embedText(memory.content);
      this.entries[memory.id] = {
        embedding,
        updatedAt: memory.updatedAt,
        signature,
      };
      changed = true;
    }

    if (changed) {
      this.saveToDisk();
    }
  }

  private async embedText(text: string): Promise<number[]> {
    const extractor = await this.getExtractor();
    const result = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(result.data as Float32Array | number[]);
    return vector.map((value) => Number(value));
  }

  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.extractorPromise = pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      ) as Promise<FeatureExtractionPipeline>;
    }

    return this.extractorPromise;
  }

  private loadFromDisk(): VectorIndexFile {
    if (!fs.existsSync(this.indexPath)) {
      return { entries: {} };
    }

    try {
      const raw = fs.readFileSync(this.indexPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<VectorIndexFile>;
      return {
        entries: parsed.entries || {},
      };
    } catch {
      return { entries: {} };
    }
  }

  private saveToDisk(): void {
    fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
    fs.writeFileSync(
      this.indexPath,
      JSON.stringify({ entries: this.entries }, null, 2),
      "utf8",
    );
  }
}

function buildMemorySignature(memory: Memory): string {
  return `${memory.updatedAt}:${memory.category}:${memory.importance}:${memory.content}`;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

let _memoryVectorStore: MemoryVectorStore | null = null;

export function getMemoryVectorStore(): MemoryVectorStore {
  if (!_memoryVectorStore) {
    _memoryVectorStore = new MemoryVectorStore();
  }

  return _memoryVectorStore;
}
