import { app } from "electron";
import fs from "fs";
import path from "path";

import {
  Memory,
  MemoryBank,
  MemoryCandidateInput,
  MemoryCategory,
  MemoryFilter,
  MemoryMaintenanceReport,
  MemoryStats,
  MemoryRetrievalItem,
  MemoryRetrievalResult,
  MemoryRetrievalSource,
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
      (memory) => memory.status === "active" && !this.isExpired(memory),
    );
  }

  public getCandidateMemories(): Memory[] {
    return Object.values(this.memoryBank.memories).filter(
      (memory) => memory.status === "candidate",
    );
  }

  public getSupersededMemories(): Memory[] {
    return Object.values(this.memoryBank.memories).filter(
      (memory) => memory.status === "superseded",
    );
  }

  public getMemory(id: string): Memory | null {
    return this.memoryBank.memories[id] || null;
  }

  /**
   * Creates a memory directly - use for:
   * - User-initiated memory creation (Settings UI)
   * - System/migration scripts
   * - Explicit "/remember" commands
   *
   * For AI-driven candidate creation, use submitMemoryCandidate() instead.
   *
   * @param autoApprove - If true, memory becomes "active" immediately.
   *                      If false, memory stays as "candidate" until approved.
   */
  public createMemory(
    content: string,
    category: MemoryCategory = "fact",
    importance: number = 5,
    source?: string,
    key?: string,
    retention: "short_term" | "long_term" = "long_term",
    expiresAt?: number,
    pendingApproval?: boolean,
    autoApprove: boolean = true,
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
      status: autoApprove ? "active" : "candidate",
      pendingApproval: pendingApproval ?? !autoApprove,
      createdAt: now,
      updatedAt: now,
      source,
      expiresAt,
    };

    this.memoryBank.memories[memory.id] = memory;
    this.saveToDisk();
    return memory;
  }

  /**
   * Creates a memory through the policy pipeline - use for:
   * - AI-driven memory extraction from conversation
   * - Candidates that need relevance/duplicate checking
   * - Memory that should respect auto-approve settings
   *
   * This applies shouldSaveMemory() filtering and conflict detection.
   * For direct user creation, use createMemory() instead.
   *
   * @param options.autoApprove - If true, bypasses approval queue (respects settings).
   */
  public submitMemoryCandidate(
    input: MemoryCandidateInput,
    source?: string,
    options?: { autoApprove?: boolean },
  ): Memory | null {
    const content = input.content.trim();
    if (!content) {
      return null;
    }

    const category = input.category || "fact";
    const retention =
      input.retention || (category === "event" ? "short_term" : "long_term");
    const expiresAt =
      input.expiresAt ||
      (retention === "short_term"
        ? Date.now() + 1000 * 60 * 60 * 24 * 7
        : undefined);
    const candidate: ExtractedMemoryCandidate = {
      content,
      category,
      importance: Math.max(1, Math.min(10, input.importance ?? 5)),
      key: input.key || this.buildMemoryKey(category, content),
      retention,
      expiresAt,
    };

    if (!this.shouldSaveMemory(candidate, content)) {
      return null;
    }

    return this.upsertMemoryCandidate(
      candidate,
      source,
      options?.autoApprove ?? false,
    );
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

    memory.status = "active";
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
    const result = await this.getMemoriesWithBudget(query);
    return result.memories.map((item) => item.memory);
  }

  public async getMemoriesWithBudget(
    query: string,
  ): Promise<MemoryRetrievalResult> {
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery
      .split(/[\s,.;:!?()[\]{}"'`~@#$%^&*+=\\/|<>-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);

    const preferredCategories = this.inferCategoriesFromQuery(normalizedQuery);
    const allActiveMemories = this.getAllMemories();
    const now = Date.now();

    const BUDGET = {
      pinned: 2,
      semantic: 4,
      shortTerm: 2,
      relationship: 1,
    };

    const result: MemoryRetrievalItem[] = [];
    const addedIds = new Set<string>();

    const pinnedMemories = allActiveMemories
      .filter((m) => m.pinned)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, BUDGET.pinned);
    for (const memory of pinnedMemories) {
      if (!addedIds.has(memory.id)) {
        result.push({
          memory,
          score: 100 + memory.importance,
          source: "pinned",
        });
        addedIds.add(memory.id);
      }
    }

    const shortTermMemories = allActiveMemories
      .filter((m) => m.retention === "short_term")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, BUDGET.shortTerm);
    for (const memory of shortTermMemories) {
      if (!addedIds.has(memory.id)) {
        result.push({
          memory,
          score: 50 + memory.importance,
          source: "short_term",
        });
        addedIds.add(memory.id);
      }
    }

    const semanticMatches = await getMemoryVectorStore().findRelevantMemories(
      query,
      allActiveMemories,
      (BUDGET.semantic + BUDGET.relationship) * 2,
    );
    const semanticScores = new Map(
      semanticMatches.map((match) => [match.memoryId, match.score]),
    );

    const scored = allActiveMemories
      .filter((m) => !addedIds.has(m.id))
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
          if (content.includes(token)) score += 4;
          if (key.includes(token)) score += 2;
        }

        if (preferredCategories.has(memory.category)) score += 8;

        score += semanticScore * 20;
        score += memory.importance * 2;

        const recencyDays = Math.max(
          0,
          (now - memory.updatedAt) / (1000 * 60 * 60 * 24),
        );
        score += Math.max(0, 10 - Math.min(recencyDays, 10));

        const source: MemoryRetrievalSource =
          memory.category === "relationship" ? "relationship" : "semantic";

        return { memory, score, source };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    const semanticResults = scored
      .filter((s) => s.source === "semantic")
      .slice(0, BUDGET.semantic);
    const relationshipResults = scored
      .filter((s) => s.source === "relationship")
      .slice(0, BUDGET.relationship);

    for (const item of [...semanticResults, ...relationshipResults]) {
      if (!addedIds.has(item.memory.id)) {
        result.push(item);
        addedIds.add(item.memory.id);
      }
    }

    return {
      memories: result,
      query,
      retrievedAt: now,
    };
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
      const memories: Record<string, Memory> = {};

      for (const [id, memory] of Object.entries(data.memories || {})) {
        const mem = memory as Partial<Memory>;
        memories[id] = {
          id: mem.id || id,
          content: mem.content || "",
          category: mem.category || "fact",
          importance: mem.importance || 5,
          key: mem.key,
          retention: mem.retention || "long_term",
          pinned: mem.pinned || false,
          status: mem.status || "active",
          supersededBy: mem.supersededBy,
          pendingApproval: mem.pendingApproval || false,
          createdAt: mem.createdAt || Date.now(),
          updatedAt: mem.updatedAt || Date.now(),
          source: mem.source,
          expiresAt: mem.expiresAt,
        };
      }

      return {
        memories,
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
      if (!this.shouldSaveMemory(candidate, userMessage)) {
        continue;
      }

      this.upsertMemoryCandidate(candidate, source, autoApprove);
    }
  }

  private shouldSaveMemory(
    candidate: ExtractedMemoryCandidate,
    userMessage: string,
  ): boolean {
    const lowerMessage = userMessage.toLowerCase();
    const smallTalkPatterns = [
      /^hi|^hello|^hey|^yo|^sup/i,
      /^ok|^okay|^sure|^yeah|^yep|^no|^nope/i,
      /^thanks?|thank you/i,
      /^(good|great|nice) (morning|afternoon|evening|day)/i,
      /^(what|how) (are you|do you).*(doing|going)/i,
      /^(have a|have an) (good|nice) (day|one|evening|morning)/i,
    ];

    for (const pattern of smallTalkPatterns) {
      if (pattern.test(lowerMessage.trim())) {
        return false;
      }
    }

    if (
      candidate.category === "event" &&
      candidate.retention !== "short_term"
    ) {
      if (
        !candidate.content.match(
          /(got|received|started|finished|completed|achievement|won|bought|moved)/i,
        )
      ) {
        return false;
      }
    }

    if (candidate.importance < 3) return false;

    return true;
  }

  private isMemoryConflict(
    existing: Memory,
    candidate: ExtractedMemoryCandidate,
  ): boolean {
    const existingLower = existing.content.toLowerCase();
    const candidateLower = candidate.content.toLowerCase();

    const conflictPatterns = [
      {
        positive: /^(like|love|enjoy|prefer).+/i,
        negative: /^(dislike|hate|dont like|not like|stop|quit|given up).+/i,
      },
      {
        positive: /^(work at|employed at|job is)/i,
        negative:
          /^(left|quit|resigned|no longer|now|changed|new).+(job|work)/i,
      },
      {
        positive: /^(live in|stay in|based in)/i,
        negative: /^(moved|moving|relocated|left).+(live|stay)/i,
      },
      {
        positive: /^(single|married|divorced|widowed)/i,
        negative: /^(now |just |recently )?(single|married|divorced|widowed)/i,
      },
    ];

    const existingPositive = conflictPatterns.some((p) =>
      p.positive.test(existingLower),
    );
    const candidateNegative = conflictPatterns.some((p) =>
      p.negative.test(candidateLower),
    );

    if (existingPositive && candidateNegative) return true;

    const existingNegative = conflictPatterns.some((p) =>
      p.negative.test(existingLower),
    );
    const candidatePositive = conflictPatterns.some((p) =>
      p.positive.test(candidateLower),
    );

    if (existingNegative && candidatePositive) return true;

    return false;
  }

  private extractMemoryCandidates(
    userMessage: string,
    assistantMessage: string,
  ): ExtractedMemoryCandidate[] {
    return extractMemoryCandidates(userMessage, assistantMessage);
  }

  private upsertMemoryCandidate(
    candidate: ExtractedMemoryCandidate,
    source?: string,
    autoApprove: boolean = false,
  ): Memory {
    const existing = this.findMemoryByKey(candidate.key, candidate.category);
    if (existing) {
      if (this.isMemoryConflict(existing, candidate)) {
        const nextMemory = this.createMemory(
          candidate.content,
          candidate.category,
          candidate.importance,
          source,
          candidate.key,
          candidate.retention,
          candidate.expiresAt,
          !autoApprove,
          autoApprove,
        );
        existing.status = "superseded";
        existing.pendingApproval = false;
        existing.supersededBy = nextMemory.id;
        existing.updatedAt = Date.now();
        this.saveToDisk();
        return nextMemory;
      }

      existing.content = candidate.content;
      existing.importance = Math.max(existing.importance, candidate.importance);
      existing.retention = candidate.retention;
      existing.expiresAt = candidate.expiresAt;
      existing.updatedAt = Date.now();
      existing.status = autoApprove ? "active" : "candidate";
      existing.pendingApproval = !autoApprove;
      if (source) {
        existing.source = source;
      }
      this.saveToDisk();
      return existing;
    }

    return this.createMemory(
      candidate.content,
      candidate.category,
      candidate.importance,
      source,
      candidate.key,
      candidate.retention,
      candidate.expiresAt,
      !autoApprove,
      autoApprove,
    );
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
