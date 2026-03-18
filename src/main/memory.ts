import { app } from "electron";
import fs from "fs";
import path from "path";

import {
  Memory,
  MemoryBank,
  MemoryCategory,
  MemoryFilter,
  MemoryMaintenanceReport,
  MemoryStats,
} from "../types/interfaces";
import { buildMoodState, DEFAULT_MOOD_STATE } from "../helpers/mood-engine";
import { getMemoryVectorStore } from "./memory-vector-store";
import {
  buildMemoryKey,
  extractMemoryCandidates,
  inferCategoriesFromQuery,
  type ExtractedMemoryCandidate,
} from "./memory-helpers";

const DEFAULT_STATS: MemoryStats = {
  bondLevel: 0,
  happiness: 50,
  totalInteractions: 0,
  lastInteractionAt: 0,
  lastMaintenanceAt: 0,
  mood: { ...DEFAULT_MOOD_STATE },
};

export class MemoryManager {
  private memoryPath = path.join(app.getPath("userData"), "memories");
  private memoryFile = path.join(this.memoryPath, "memory.json");
  private memoryBank: MemoryBank = this.loadFromDisk();

  public getAllMemories(): Memory[] {
    return Object.values(this.memoryBank.memories).filter(
      (memory) => !this.isExpired(memory),
    );
  }

  public getMemory(id: string): Memory | null {
    return this.memoryBank.memories[id] || null;
  }

  public createMemory(
    content: string,
    category: MemoryCategory = "fact",
    importance: number = 5,
    source?: string,
    key?: string,
    retention: "short_term" | "long_term" = "long_term",
    expiresAt?: number,
    pendingApproval?: boolean,
  ): Memory {
    const now = Date.now();
    const memory: Memory = {
      id: crypto.randomUUID(),
      content: content.trim(),
      category,
      importance: Math.max(1, Math.min(10, importance)),
      key,
      retention,
      pinned: false,
      pendingApproval: pendingApproval ?? false,
      createdAt: now,
      updatedAt: now,
      source,
      expiresAt,
    };

    this.memoryBank.memories[memory.id] = memory;
    this.saveToDisk();
    return memory;
  }

  public updateMemory(
    id: string,
    updates: Partial<
      Pick<
        Memory,
        | "content"
        | "category"
        | "importance"
        | "key"
        | "retention"
        | "expiresAt"
      >
    >,
  ): Memory | null {
    const memory = this.memoryBank.memories[id];
    if (!memory) return null;

    if (updates.content !== undefined) {
      memory.content = updates.content.trim();
    }
    if (updates.category !== undefined) {
      memory.category = updates.category;
    }
    if (updates.importance !== undefined) {
      memory.importance = Math.max(1, Math.min(10, updates.importance));
    }
    if (updates.key !== undefined) {
      memory.key = updates.key;
    }
    if (updates.retention !== undefined) {
      memory.retention = updates.retention;
    }
    if (updates.expiresAt !== undefined) {
      memory.expiresAt = updates.expiresAt;
    }

    memory.updatedAt = Date.now();
    this.saveToDisk();
    return memory;
  }

  public deleteMemory(id: string): boolean {
    if (this.memoryBank.memories[id]) {
      delete this.memoryBank.memories[id];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public deleteAllMemories(): void {
    this.memoryBank.memories = {};
    this.saveToDisk();
  }

  public togglePin(id: string): Memory | null {
    const memory = this.memoryBank.memories[id];
    if (!memory) return null;

    memory.pinned = !memory.pinned;
    memory.updatedAt = Date.now();
    this.saveToDisk();
    return memory;
  }

  public getPinnedMemories(): Memory[] {
    return this.getAllMemories().filter((memory) => memory.pinned);
  }

  public getPendingApprovalMemories(): Memory[] {
    return Object.values(this.memoryBank.memories).filter(
      (memory) => memory.pendingApproval,
    );
  }

  public approveMemory(id: string): Memory | null {
    const memory = this.memoryBank.memories[id];
    if (!memory || !memory.pendingApproval) return null;

    memory.pendingApproval = false;
    memory.updatedAt = Date.now();
    this.saveToDisk();
    return memory;
  }

  public rejectMemory(id: string): boolean {
    if (this.memoryBank.memories[id]) {
      delete this.memoryBank.memories[id];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public searchMemories(filter: MemoryFilter = {}): Memory[] {
    let memories = this.getAllMemories();

    if (filter.category) {
      memories = memories.filter(
        (memory) => memory.category === filter.category,
      );
    }

    if (filter.minImportance !== undefined) {
      memories = memories.filter(
        (memory) => memory.importance >= filter.minImportance!,
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      memories = memories.filter((memory) =>
        memory.content.toLowerCase().includes(query),
      );
    }

    return memories.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  public getMemoriesForContext(
    limit: number = 10,
    category?: MemoryCategory,
  ): Memory[] {
    const memories = this.searchMemories(category ? { category } : {});
    const longTerm = memories
      .filter(
        (memory) =>
          (memory.retention || "long_term") === "long_term" &&
          memory.importance >= 5,
      )
      .slice(0, limit);
    const shortTerm = memories
      .filter((memory) => (memory.retention || "long_term") === "short_term")
      .slice(0, Math.max(4, Math.ceil(limit / 3)));

    return [...shortTerm, ...longTerm].slice(0, limit);
  }

  public async getRelevantMemoriesForQuery(
    query: string,
    limit: number = 8,
  ): Promise<Memory[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery
      .split(/[\s,.;:!?()[\]{}"'`~@#$%^&*+=\\/|<>-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);

    const preferredCategories = this.inferCategoriesFromQuery(normalizedQuery);
    const memories = this.getAllMemories();
    const now = Date.now();
    const semanticMatches = await getMemoryVectorStore().findRelevantMemories(
      query,
      memories,
      limit * 2,
    );
    const semanticScores = new Map(
      semanticMatches.map((match) => [match.memoryId, match.score]),
    );

    const scored = memories
      .map((memory) => {
        const content = memory.content.toLowerCase();
        const key = (memory.key || "").toLowerCase();
        let score = 0;
        const semanticScore = semanticScores.get(memory.id) || 0;

        if (normalizedQuery) {
          if (
            content.includes(normalizedQuery) ||
            key.includes(normalizedQuery)
          ) {
            score += 18;
          }
        }

        for (const token of tokens) {
          if (content.includes(token)) {
            score += 4;
          }
          if (key.includes(token)) {
            score += 2;
          }
        }

        if (preferredCategories.has(memory.category)) {
          score += 8;
        }

        score += semanticScore * 20;
        score += memory.importance * 2;

        const recencyDays = Math.max(
          0,
          (now - memory.updatedAt) / (1000 * 60 * 60 * 24),
        );
        score += Math.max(0, 10 - Math.min(recencyDays, 10));

        return { memory, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.memory.importance !== a.memory.importance) {
          return b.memory.importance - a.memory.importance;
        }
        return b.memory.updatedAt - a.memory.updatedAt;
      });

    return scored.slice(0, limit).map(({ memory }) => memory);
  }

  public recordActionOutcome(params: {
    toolName: string;
    args?: Record<string, unknown>;
    success: boolean;
    summary: string;
    source?: string;
  }): MemoryStats {
    const actionSummary = params.summary.trim();

    this.createMemory(
      actionSummary,
      "event",
      params.success ? 6 : 4,
      params.source,
      `action:${params.toolName}:${Date.now()}`,
      "short_term",
      Date.now() + 1000 * 60 * 60 * 24 * 7,
    );

    const current = this.getStats();
    const moodBoost = params.success ? 4 : -6;
    const bondBoost = params.success ? 1 : -1;
    const batteryShift = params.success ? -1 : -4;

    const nextStats: MemoryStats = {
      ...current,
      bondLevel: this.clamp(current.bondLevel + bondBoost, 0, 100),
      happiness: this.clamp(current.happiness + moodBoost, 0, 100),
      lastInteractionAt: Date.now(),
      mood: {
        ...current.mood,
        socialBattery: this.clamp(
          current.mood.socialBattery + batteryShift,
          0,
          100,
        ),
        updatedAt: Date.now(),
        summary: params.success
          ? `Felt encouraged after successfully using ${params.toolName}.`
          : `Felt a little drained after ${params.toolName} did not go as planned.`,
      },
    };

    nextStats.mood = buildMoodState(
      nextStats,
      `Tool action: ${params.toolName}`,
      actionSummary,
    );

    this.memoryBank.stats = nextStats;
    this.saveToDisk();
    return this.getStats();
  }

  public getStats(): MemoryStats {
    return {
      ...this.memoryBank.stats,
      mood: {
        ...DEFAULT_MOOD_STATE,
        ...this.memoryBank.stats.mood,
      },
    };
  }

  public updateStats(updates: Partial<MemoryStats>): MemoryStats {
    this.memoryBank.stats = {
      ...this.memoryBank.stats,
      ...updates,
      mood: {
        ...DEFAULT_MOOD_STATE,
        ...this.memoryBank.stats.mood,
        ...(updates.mood || {}),
      },
      bondLevel: this.clamp(
        updates.bondLevel ?? this.memoryBank.stats.bondLevel,
        0,
        100,
      ),
      happiness: this.clamp(
        updates.happiness ?? this.memoryBank.stats.happiness,
        0,
        100,
      ),
    };
    this.saveToDisk();
    return this.memoryBank.stats;
  }

  public incrementInteractions(): void {
    this.memoryBank.stats.totalInteractions++;
    this.memoryBank.stats.lastInteractionAt = Date.now();
    this.saveToDisk();
  }

  public updateRelationship(bondDelta: number, happinessDelta: number): void {
    const current = this.memoryBank.stats;
    this.memoryBank.stats = {
      ...current,
      bondLevel: this.clamp(current.bondLevel + bondDelta, 0, 100),
      happiness: this.clamp(current.happiness + happinessDelta, 0, 100),
      lastInteractionAt: Date.now(),
    };
    this.saveToDisk();
  }

  public processConversationTurn(
    userMessage: string,
    assistantMessage: string,
    updates?: { bond?: number; happiness?: number },
    source?: string,
    options?: { autoApprove?: boolean },
  ): MemoryStats {
    const current = this.getStats();
    const nextStats: MemoryStats = {
      ...current,
      bondLevel: this.clamp(current.bondLevel + (updates?.bond ?? 0), 0, 100),
      happiness: this.clamp(
        current.happiness + (updates?.happiness ?? 0),
        0,
        100,
      ),
      totalInteractions: current.totalInteractions + 1,
      lastInteractionAt: Date.now(),
      mood: { ...current.mood },
    };

    nextStats.mood = buildMoodState(nextStats, userMessage, assistantMessage);
    this.scoreConversationMemories(
      userMessage,
      assistantMessage,
      source,
      options?.autoApprove ?? true,
    );
    this.memoryBank.stats = nextStats;
    this.runMaintenanceIfDue();
    this.saveToDisk();
    return this.getStats();
  }

  public handleExplicitMemoryCommand(
    input: string,
    source?: string,
  ): { handled: boolean; response?: string } {
    const rememberMatch =
      input.match(/^\s*(?:remember|remember that)\s+(.+)$/i) ||
      input.match(/^\s*(?:จำไว้ว่า|จำไว้|จำเรื่อง)\s*(.+)$/i);
    if (rememberMatch?.[1]) {
      const content = rememberMatch[1].trim();
      const candidates = this.extractMemoryCandidates(
        content,
        "Explicit remember command",
      );
      const candidate =
        candidates[0] ||
        ({
          content: `User note: ${content}`,
          category: "fact",
          importance: 8,
          key: this.buildMemoryKey("fact", content),
          retention: "long_term",
        } satisfies ExtractedMemoryCandidate);

      const existing = this.findMemoryByKey(candidate.key, candidate.category);
      if (existing) {
        existing.content = candidate.content;
        existing.importance = Math.max(
          existing.importance,
          candidate.importance,
        );
        existing.retention = candidate.retention;
        existing.expiresAt = candidate.expiresAt;
        existing.updatedAt = Date.now();
        if (source) {
          existing.source = source;
        }
        this.saveToDisk();
      } else {
        this.createMemory(
          candidate.content,
          candidate.category,
          candidate.importance,
          source,
          candidate.key,
          candidate.retention,
          candidate.expiresAt,
        );
      }

      return {
        handled: true,
        response: `โอเค เราจะจำไว้ว่า ${content}`,
      };
    }

    const forgetMatch =
      input.match(/^\s*(?:forget|forget that|forget about)\s+(.+)$/i) ||
      input.match(/^\s*(?:ลืมว่า|ลืมเรื่อง|ลืม)\s*(.+)$/i);
    if (forgetMatch?.[1]) {
      const query = forgetMatch[1].trim().toLowerCase();
      const matches = this.getAllMemories().filter((memory) =>
        memory.content.toLowerCase().includes(query),
      );

      if (matches.length === 0) {
        return {
          handled: true,
          response: `ยังไม่เจอความจำที่ตรงกับ "${forgetMatch[1].trim()}"`,
        };
      }

      matches.forEach((memory) => {
        delete this.memoryBank.memories[memory.id];
      });
      this.saveToDisk();

      return {
        handled: true,
        response:
          matches.length === 1
            ? "ลืมเรื่องนั้นให้แล้ว"
            : `ลบความจำที่เกี่ยวข้องให้แล้ว ${matches.length} รายการ`,
      };
    }

    return { handled: false };
  }

  public runMaintenanceIfDue(now = Date.now()) {
    const lastRun = this.memoryBank.stats.lastMaintenanceAt || 0;
    const oneDay = 1000 * 60 * 60 * 24;
    if (now - lastRun < oneDay) {
      return null;
    }

    return this.runMaintenance(now);
  }

  public runMaintenance(now = Date.now()): MemoryMaintenanceReport {
    let removed = 0;
    let merged = 0;
    let summarized = 0;

    for (const memory of Object.values(this.memoryBank.memories)) {
      if (this.isExpired(memory)) {
        delete this.memoryBank.memories[memory.id];
        removed++;
      }
    }

    const seenKeys = new Map<string, Memory>();
    for (const memory of this.getAllMemories()) {
      const dedupeKey = `${memory.category}:${memory.key || this.normalizeMemoryText(memory.content)}`;
      const existing = seenKeys.get(dedupeKey);

      if (!existing) {
        seenKeys.set(dedupeKey, memory);
        continue;
      }

      if (existing.updatedAt >= memory.updatedAt) {
        existing.importance = Math.max(existing.importance, memory.importance);
        delete this.memoryBank.memories[memory.id];
      } else {
        memory.importance = Math.max(memory.importance, existing.importance);
        delete this.memoryBank.memories[existing.id];
        seenKeys.set(dedupeKey, memory);
      }
      merged++;
    }

    const oldShortTermEvents = this.getAllMemories().filter(
      (memory) =>
        memory.retention === "short_term" &&
        memory.category === "event" &&
        now - memory.updatedAt > 1000 * 60 * 60 * 24,
    );
    if (oldShortTermEvents.length >= 3) {
      const summary = oldShortTermEvents
        .slice(0, 5)
        .map((memory) => memory.content.replace(/^Recent context:\s*/i, ""))
        .join(" | ");
      this.createMemory(
        `Compressed recent context: ${summary}`,
        "event",
        5,
        "maintenance",
        `summary.recent.${new Date(now).toISOString().slice(0, 10)}`,
        "long_term",
      );
      oldShortTermEvents.forEach((memory) => {
        delete this.memoryBank.memories[memory.id];
      });
      summarized = 1;
    }

    const conflictsDetected = this.getMemoryConflicts().length;
    this.memoryBank.stats.lastMaintenanceAt = now;
    this.saveToDisk();

    return {
      removed,
      merged,
      summarized,
      conflictsDetected,
      ranAt: now,
    };
  }

  public getMemoryConflicts() {
    const byKey = new Map<string, Memory[]>();

    for (const memory of this.getAllMemories()) {
      if (!memory.key || memory.retention === "short_term") {
        continue;
      }

      const grouped = byKey.get(memory.key) || [];
      grouped.push(memory);
      byKey.set(memory.key, grouped);
    }

    return Array.from(byKey.entries())
      .map(([key, memories]) => ({
        key,
        memories: memories.sort((a, b) => b.updatedAt - a.updatedAt),
      }))
      .filter(({ memories }) => {
        if (memories.length < 2) {
          return false;
        }

        const normalized = new Set(
          memories.map((memory) => this.normalizeMemoryText(memory.content)),
        );
        return normalized.size > 1;
      });
  }

  public getMemoryBank(): MemoryBank {
    return {
      memories: { ...this.memoryBank.memories },
      stats: { ...this.memoryBank.stats },
    };
  }

  public importMemoryBank(bank: MemoryBank): void {
    this.memoryBank = {
      memories: { ...bank.memories },
      stats: {
        ...DEFAULT_STATS,
        ...bank.stats,
        mood: {
          ...DEFAULT_MOOD_STATE,
          ...(bank.stats?.mood || {}),
        },
      },
    };
    this.saveToDisk();
  }

  public migrateFromUserMemory(userMemory: string): number {
    if (!userMemory.trim()) return 0;

    const lines = userMemory
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("-"));

    let migrated = 0;
    for (const line of lines) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content) {
        this.createMemory(content, "fact", 5);
        migrated++;
      }
    }

    return migrated;
  }

  private loadFromDisk(): MemoryBank {
    if (!fs.existsSync(this.memoryFile)) {
      return {
        memories: {},
        stats: { ...DEFAULT_STATS },
      };
    }

    try {
      const content = fs.readFileSync(this.memoryFile, "utf8");
      const data = JSON.parse(content);
      return {
        memories: data.memories || {},
        stats: {
          ...DEFAULT_STATS,
          ...(data.stats || {}),
          mood: {
            ...DEFAULT_MOOD_STATE,
            ...(data.stats?.mood || {}),
          },
        },
      };
    } catch (error) {
      console.error("Error loading memory bank:", error);
      return {
        memories: {},
        stats: { ...DEFAULT_STATS },
      };
    }
  }

  private inferCategoriesFromQuery(query: string): Set<MemoryCategory> {
    return inferCategoriesFromQuery(query);
  }

  private saveToDisk(): void {
    try {
      fs.mkdirSync(this.memoryPath, { recursive: true });
      fs.writeFileSync(
        this.memoryFile,
        JSON.stringify(this.memoryBank, null, 2),
      );
    } catch (error) {
      console.error("Error saving memory bank:", error);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private scoreConversationMemories(
    userMessage: string,
    assistantMessage: string,
    source?: string,
    autoApprove: boolean = true,
  ) {
    const candidates = this.extractMemoryCandidates(
      userMessage,
      assistantMessage,
    );

    for (const candidate of candidates) {
      const existing = this.findMemoryByKey(candidate.key, candidate.category);
      if (existing) {
        existing.content = candidate.content;
        existing.importance = Math.max(
          existing.importance,
          candidate.importance,
        );
        existing.retention = candidate.retention;
        existing.expiresAt = candidate.expiresAt;
        existing.updatedAt = Date.now();
        if (source) {
          existing.source = source;
        }
        continue;
      }

      this.createMemory(
        candidate.content,
        candidate.category,
        candidate.importance,
        source,
        candidate.key,
        candidate.retention,
        candidate.expiresAt,
        !autoApprove,
      );
    }
  }

  private extractMemoryCandidates(
    userMessage: string,
    assistantMessage: string,
  ): ExtractedMemoryCandidate[] {
    return extractMemoryCandidates(userMessage, assistantMessage);
  }

  private findMemoryByKey(key: string, category: MemoryCategory) {
    return this.getAllMemories().find(
      (memory) => memory.key === key && memory.category === category,
    );
  }

  private normalizeMemoryText(content: string) {
    return content.toLowerCase().replace(/\s+/g, " ").trim();
  }

  private buildMemoryKey(category: MemoryCategory, rawContent: string) {
    return buildMemoryKey(category, rawContent);
  }

  private isExpired(memory: Memory) {
    return (
      typeof memory.expiresAt === "number" && memory.expiresAt < Date.now()
    );
  }
}

let _memoryManager: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!_memoryManager) {
    _memoryManager = new MemoryManager();
  }
  return _memoryManager;
}
