import { SharedState } from "../sharedState";
import {
  ChatRecord,
  ChatWithMessages,
  MessageRecord,
  Versions,
  Memory,
  MemoryFilter,
  MemoryMaintenanceReport,
  MemoryStats,
} from "../types/interfaces";
import { DebugState } from "../debugState";

import type { BubbleView } from "./contexts/BubbleViewContext";
import { Data } from "electron";

export type ClippyApi = {
  // Window
  toggleChatWindow: () => Promise<void>;
  togglePostItWindow: () => Promise<void>;
  minimizeChatWindow: () => Promise<void>;
  maximizeChatWindow: () => Promise<void>;
  minimizeMainWindow: () => Promise<void>;
  maximizeMainWindow: () => Promise<void>;
  closeMainWindow: () => Promise<void>;
  getMainWindowPosition: () => Promise<{ x: number; y: number } | null>;
  setMainWindowPosition: (x: number, y: number) => Promise<void>;
  onSetBubbleView: (callback: (bubbleView: BubbleView) => void) => void;
  offSetBubbleView: () => void;
  popupAppMenu: () => void;
  // State
  offStateChanged: () => void;
  onStateChanged: (callback: (state: SharedState) => void) => void;
  getFullState: () => Promise<SharedState>;
  getState: (key: string) => Promise<any>;
  setState: (key: string, value: any) => Promise<void>;
  openStateInEditor: () => Promise<void>;
  // Debug
  offDebugStateChanged: () => void;
  onDebugStateChanged: (callback: (state: DebugState) => void) => void;
  getFullDebugState: () => Promise<DebugState>;
  getDebugState: (key: string) => Promise<any>;
  setDebugState: (key: string, value: any) => Promise<void>;
  openDebugStateInEditor: () => Promise<void>;
  // App
  getVersions: () => Promise<Versions>;
  checkForUpdates: () => Promise<void>;
  exportBackup: () => Promise<{ success: boolean; path?: string }>;
  importBackup: () => Promise<{ success: boolean; path?: string }>;
  openPowerShellLog: () => Promise<void>;
  sendTelegramNotification: (payload: {
    message: string;
    reason?: string;
    source: "manual" | "rule" | "agent";
    allowDuringQuietHours?: boolean;
  }) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  // Chats
  getChatRecords: () => Promise<Record<string, ChatRecord>>;
  getChatWithMessages: (chatId: string) => Promise<ChatWithMessages | null>;
  writeChatWithMessages: (chatWithMessages: ChatWithMessages) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
  onNewChat: (callback: () => void) => void;
  offNewChat: () => void;
  startChatStream: (payload: {
    requestId: string;
    provider?: string;
    model?: string;
    systemPrompt: string;
    message: string;
    images?: string[];
    history: MessageRecord[];
    temperature?: number;
    topK?: number;
  }) => Promise<{ started: boolean }>;
  abortChatStream: (requestId: string) => Promise<void>;
  onChatStreamChunk: (
    callback: (payload: { requestId: string; chunk: string }) => void,
  ) => void;
  offChatStreamChunk: () => void;
  onChatStreamEnd: (callback: (payload: { requestId: string }) => void) => void;
  offChatStreamEnd: () => void;
  onChatStreamError: (
    callback: (payload: { requestId: string; error: string }) => void,
  ) => void;
  offChatStreamError: () => void;
  transcribeAudio: (payload: {
    audioBase64: string;
    mimeType: string;
    provider?: string;
    model?: string;
  }) => Promise<string>;
  // Clipboard
  clipboardWrite: (data: Data) => Promise<void>;
  // Memory
  getAllMemories: () => Promise<Memory[]>;
  getMemory: (id: string) => Promise<Memory | null>;
  createMemory: (
    content: string,
    category: string,
    importance: number,
    source?: string,
  ) => Promise<Memory>;
  updateMemory: (
    id: string,
    updates: {
      content?: string;
      category?: string;
      importance?: number;
      key?: string;
      retention?: "short_term" | "long_term";
      expiresAt?: number;
    },
  ) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  searchMemories: (filter: MemoryFilter) => Promise<Memory[]>;
  getMemoryStats: () => Promise<MemoryStats>;
  updateMemoryStats: (updates: Partial<MemoryStats>) => Promise<MemoryStats>;
  processConversationTurn: (
    userMessage: string,
    assistantMessage: string,
    updates?: { bond?: number; happiness?: number },
    source?: string,
    options?: { autoApprove?: boolean },
  ) => Promise<MemoryStats>;
  recordActionOutcome: (payload: {
    toolName: string;
    args?: Record<string, unknown>;
    success: boolean;
    summary: string;
    source?: string;
  }) => Promise<MemoryStats>;
  handleMemoryCommand: (
    input: string,
    source?: string,
  ) => Promise<{ handled: boolean; response?: string }>;
  runMemoryMaintenance: () => Promise<MemoryMaintenanceReport>;
  deleteAllMemories: () => Promise<void>;
  togglePinMemory: (id: string) => Promise<Memory | null>;
  getPinnedMemories: () => Promise<Memory[]>;
  getPendingApprovalMemories: () => Promise<Memory[]>;
  approveMemory: (id: string) => Promise<Memory | null>;
  rejectMemory: (id: string) => Promise<boolean>;
  // Identity
  getIdentity: () => Promise<{
    name: string;
    vibe: string;
    emoji: string;
    mission: string;
  }>;
  setIdentity: (data: {
    name: string;
    vibe: string;
    emoji: string;
    mission: string;
  }) => Promise<void>;
  // User Profile
  getUser: () => Promise<{
    name: string;
    nickname: string;
    pronouns: string;
    timezone: string;
    language: string;
    communicationStyle: string;
    responseLength: string;
    tone: string;
    topicsToAvoid: string;
    notes: string;
  }>;
  setUser: (data: {
    name: string;
    nickname: string;
    pronouns: string;
    timezone: string;
    language: string;
    communicationStyle: string;
    responseLength: string;
    tone: string;
    topicsToAvoid: string;
    notes: string;
  }) => Promise<void>;
  // Desktop Tools
  executeTool: (
    toolName: string,
    args: Record<string, any>,
  ) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  getToolSchema: () => Promise<Record<string, any>>;
  // Web Tools
  webSearch: (
    query: string,
    numResults?: number,
  ) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  fetchUrl: (url: string) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  // TTS
  ttsSpeak: (text: string, voice?: string) => Promise<string>;
  ttsGetVoices: () => Promise<string[]>;
  ttsSpeakThai: (text: string) => Promise<string>;
};

declare global {
  interface Window {
    clippy: ClippyApi;
  }
}

export const clippyApi = window["clippy"];
