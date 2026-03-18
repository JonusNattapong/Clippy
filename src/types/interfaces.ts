export interface MessageRecord {
  id: string;
  content?: string;
  sender: "user" | "clippy";
  createdAt: number;
  images?: string[]; // base64 encoded images
}

export interface ChatRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
}

export interface ChatWithMessages {
  chat: ChatRecord;
  messages: MessageRecord[];
}

export type ChatRecordsState = Record<string, ChatRecord>;

export interface Versions extends NodeJS.ProcessVersions {
  clippy: string;
  electron: string;
  chromium: string;
}

export type ClippyMood =
  | "calm"
  | "playful"
  | "supportive"
  | "excited"
  | "focused"
  | "concerned";

export type ClippyResponseStyle = "gentle" | "balanced" | "energetic";

export type UserTone =
  | "neutral"
  | "positive"
  | "affectionate"
  | "curious"
  | "distressed"
  | "frustrated";

export interface MoodState {
  primary: ClippyMood;
  intensity: number; // 0-100
  socialBattery: number; // 0-100
  responseStyle: ClippyResponseStyle;
  userTone: UserTone;
  summary: string;
  updatedAt: number;
}

// Memory System Types
export type MemoryCategory = "fact" | "preference" | "event" | "relationship";

export type MemoryStatus = "candidate" | "active" | "superseded";

export interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number; // 1-10
  key?: string;
  retention?: "short_term" | "long_term";
  pinned?: boolean;
  status: MemoryStatus;
  supersededBy?: string; // ID of the memory that superseded this one
  pendingApproval?: boolean;
  createdAt: number;
  updatedAt: number;
  source?: string; // chat ID that created this memory
  expiresAt?: number;
}

export interface MemoryCandidateInput {
  content: string;
  category?: MemoryCategory;
  importance?: number;
  key?: string;
  retention?: "short_term" | "long_term";
  expiresAt?: number;
}

export interface MemoryStats {
  bondLevel: number; // 0-100
  happiness: number; // 0-100
  totalInteractions: number;
  lastInteractionAt: number;
  lastMaintenanceAt?: number;
  mood: MoodState;
}

export interface MemoryMaintenanceReport {
  removed: number;
  merged: number;
  summarized: number;
  conflictsDetected: number;
  ranAt: number;
}

export interface MemoryBank {
  memories: Record<string, Memory>;
  stats: MemoryStats;
}

export type MemoryFilter = {
  category?: MemoryCategory;
  minImportance?: number;
  searchQuery?: string;
};

export type MemoryRetrievalSource =
  | "pinned"
  | "semantic"
  | "short_term"
  | "relationship"
  | "summary";

export interface MemoryRetrievalItem {
  memory: Memory;
  score: number;
  source: MemoryRetrievalSource;
}

export interface MemoryRetrievalResult {
  memories: MemoryRetrievalItem[];
  query: string;
  retrievedAt: number;
}
