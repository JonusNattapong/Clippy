// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, Data, ipcRenderer } from "electron";
import { IpcMessages } from "../ipc-messages";
import type { SharedState } from "../sharedState";

import type { ClippyApi } from "./clippyApi";
import {
  ChatWithMessages,
  Memory,
  MemoryFilter,
  MemoryStats,
} from "../types/interfaces";
import { DebugState } from "../debugState";
import { BubbleView } from "./contexts/BubbleViewContext";

const clippyApi: ClippyApi = {
  // Window
  toggleChatWindow: () => ipcRenderer.invoke(IpcMessages.TOGGLE_CHAT_WINDOW),
  togglePostItWindow: () =>
    ipcRenderer.invoke(IpcMessages.TOGGLE_POSTIT_WINDOW),
  minimizeChatWindow: () =>
    ipcRenderer.invoke(IpcMessages.MINIMIZE_CHAT_WINDOW),
  maximizeChatWindow: () =>
    ipcRenderer.invoke(IpcMessages.MAXIMIZE_CHAT_WINDOW),
  minimizeMainWindow: () =>
    ipcRenderer.invoke(IpcMessages.MINIMIZE_MAIN_WINDOW),
  maximizeMainWindow: () =>
    ipcRenderer.invoke(IpcMessages.MAXIMIZE_MAIN_WINDOW),
  closeMainWindow: () => ipcRenderer.invoke(IpcMessages.CLOSE_MAIN_WINDOW),
  getMainWindowPosition: () =>
    ipcRenderer.invoke(IpcMessages.GET_MAIN_WINDOW_POSITION),
  setMainWindowPosition: (x: number, y: number) =>
    ipcRenderer.invoke(IpcMessages.SET_MAIN_WINDOW_POSITION, x, y),
  onSetBubbleView(callback: (bubbleView: BubbleView) => void) {
    ipcRenderer.on(IpcMessages.SET_BUBBLE_VIEW, (_event, bubbleView) =>
      callback(bubbleView),
    );
  },
  offSetBubbleView() {
    ipcRenderer.removeAllListeners(IpcMessages.SET_BUBBLE_VIEW);
  },
  popupAppMenu: () => ipcRenderer.invoke(IpcMessages.POPUP_APP_MENU),

  // State
  getFullState: () => ipcRenderer.invoke(IpcMessages.STATE_GET_FULL),
  getState: (key: string) => ipcRenderer.invoke(IpcMessages.STATE_GET, key),
  setState: (key: string, value: any) =>
    ipcRenderer.invoke(IpcMessages.STATE_SET, key, value),
  openStateInEditor: () => ipcRenderer.invoke(IpcMessages.STATE_OPEN_IN_EDITOR),
  onStateChanged: (callback: (state: SharedState) => void) => {
    ipcRenderer.on(IpcMessages.STATE_CHANGED, (_event, state: SharedState) =>
      callback(state),
    );
  },
  offStateChanged: () => {
    ipcRenderer.removeAllListeners(IpcMessages.STATE_CHANGED);
  },

  // Debug
  getFullDebugState: () => ipcRenderer.invoke(IpcMessages.DEBUG_STATE_GET_FULL),
  getDebugState: (key: string) =>
    ipcRenderer.invoke(IpcMessages.DEBUG_STATE_GET, key),
  setDebugState: (key: string, value: any) =>
    ipcRenderer.invoke(IpcMessages.DEBUG_STATE_SET, key, value),
  openDebugStateInEditor: () =>
    ipcRenderer.invoke(IpcMessages.DEBUG_STATE_OPEN_IN_EDITOR),
  onDebugStateChanged: (callback: (state: DebugState) => void) => {
    ipcRenderer.on(
      IpcMessages.DEBUG_STATE_CHANGED,
      (_event, state: DebugState) => callback(state),
    );
  },
  offDebugStateChanged: () => {
    ipcRenderer.removeAllListeners(IpcMessages.DEBUG_STATE_CHANGED);
  },

  // Chats
  getChatRecords: () => ipcRenderer.invoke(IpcMessages.CHAT_GET_CHAT_RECORDS),
  getChatWithMessages: (chatId: string) =>
    ipcRenderer.invoke(IpcMessages.CHAT_GET_CHAT_WITH_MESSAGES, chatId),
  writeChatWithMessages: (chatWithMessages: ChatWithMessages) =>
    ipcRenderer.invoke(
      IpcMessages.CHAT_WRITE_CHAT_WITH_MESSAGES,
      chatWithMessages,
    ),
  deleteChat: (chatId: string) =>
    ipcRenderer.invoke(IpcMessages.CHAT_DELETE_CHAT, chatId),
  deleteAllChats: () => ipcRenderer.invoke(IpcMessages.CHAT_DELETE_ALL_CHATS),
  onNewChat: (callback: () => void) => {
    ipcRenderer.on(IpcMessages.CHAT_NEW_CHAT, callback);
  },
  offNewChat: () => {
    ipcRenderer.removeAllListeners(IpcMessages.CHAT_NEW_CHAT);
  },
  startChatStream: (payload) =>
    ipcRenderer.invoke(IpcMessages.CHAT_STREAM_START, payload),
  abortChatStream: (requestId: string) =>
    ipcRenderer.invoke(IpcMessages.CHAT_STREAM_ABORT, requestId),
  onChatStreamChunk: (callback) => {
    ipcRenderer.on(IpcMessages.CHAT_STREAM_CHUNK, (_event, payload) =>
      callback(payload),
    );
  },
  offChatStreamChunk: () => {
    ipcRenderer.removeAllListeners(IpcMessages.CHAT_STREAM_CHUNK);
  },
  onChatStreamEnd: (callback) => {
    ipcRenderer.on(IpcMessages.CHAT_STREAM_END, (_event, payload) =>
      callback(payload),
    );
  },
  offChatStreamEnd: () => {
    ipcRenderer.removeAllListeners(IpcMessages.CHAT_STREAM_END);
  },
  onChatStreamError: (callback) => {
    ipcRenderer.on(IpcMessages.CHAT_STREAM_ERROR, (_event, payload) =>
      callback(payload),
    );
  },
  offChatStreamError: () => {
    ipcRenderer.removeAllListeners(IpcMessages.CHAT_STREAM_ERROR);
  },
  transcribeAudio: (payload) =>
    ipcRenderer.invoke(IpcMessages.CHAT_TRANSCRIBE_AUDIO, payload),
  generateBubbleText: (payload) =>
    ipcRenderer.invoke(IpcMessages.CHAT_GENERATE_BUBBLE_TEXT, payload),

  // App
  getVersions: () => ipcRenderer.invoke(IpcMessages.APP_GET_VERSIONS),
  checkForUpdates: () => ipcRenderer.invoke(IpcMessages.APP_CHECK_FOR_UPDATES),
  exportBackup: () => ipcRenderer.invoke(IpcMessages.APP_EXPORT_BACKUP),
  importBackup: () => ipcRenderer.invoke(IpcMessages.APP_IMPORT_BACKUP),
  openPowerShellLog: () =>
    ipcRenderer.invoke(IpcMessages.APP_OPEN_POWERSHELL_LOG),
  sendTelegramNotification: (payload) =>
    ipcRenderer.invoke(IpcMessages.APP_SEND_TELEGRAM_NOTIFICATION, payload),

  // Clipboard
  clipboardWrite: (data: Data) =>
    ipcRenderer.invoke(IpcMessages.CLIPBOARD_WRITE, data),

  // Memory
  getAllMemories: () => ipcRenderer.invoke(IpcMessages.MEMORY_GET_ALL),
  getMemory: (id: string) => ipcRenderer.invoke(IpcMessages.MEMORY_GET, id),
  createMemory: (
    content: string,
    category: string,
    importance: number,
    source?: string,
  ) =>
    ipcRenderer.invoke(
      IpcMessages.MEMORY_CREATE,
      content,
      category,
      importance,
      source,
    ),
  submitMemoryCandidate: (
    input,
    source?: string,
    options?: { autoApprove?: boolean },
  ) =>
    ipcRenderer.invoke(
      IpcMessages.MEMORY_SUBMIT_CANDIDATE,
      input,
      source,
      options,
    ),
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
  ) => ipcRenderer.invoke(IpcMessages.MEMORY_UPDATE, id, updates),
  deleteMemory: (id: string) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_DELETE, id),
  searchMemories: (filter: MemoryFilter) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_SEARCH, filter),
  getMemoryStats: () => ipcRenderer.invoke(IpcMessages.MEMORY_GET_STATS),
  updateMemoryStats: (updates: Partial<MemoryStats>) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_UPDATE_STATS, updates),
  processConversationTurn: (
    userMessage: string,
    assistantMessage: string,
    updates?: { bond?: number; happiness?: number },
    source?: string,
    options?: { autoApprove?: boolean },
  ) =>
    ipcRenderer.invoke(
      IpcMessages.MEMORY_PROCESS_TURN,
      userMessage,
      assistantMessage,
      updates,
      source,
      options,
    ),
  recordActionOutcome: (payload: {
    toolName: string;
    args?: Record<string, unknown>;
    success: boolean;
    summary: string;
    source?: string;
  }) => ipcRenderer.invoke(IpcMessages.MEMORY_RECORD_ACTION, payload),
  handleMemoryCommand: (input: string, source?: string) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_HANDLE_COMMAND, input, source),
  runMemoryMaintenance: () =>
    ipcRenderer.invoke(IpcMessages.MEMORY_RUN_MAINTENANCE),
  deleteAllMemories: () => ipcRenderer.invoke(IpcMessages.MEMORY_DELETE_ALL),
  togglePinMemory: (id: string) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_TOGGLE_PIN, id),
  getPinnedMemories: () => ipcRenderer.invoke(IpcMessages.MEMORY_GET_PINNED),
  getPendingApprovalMemories: () =>
    ipcRenderer.invoke(IpcMessages.MEMORY_GET_PENDING),
  approveMemory: (id: string) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_APPROVE, id),
  rejectMemory: (id: string) =>
    ipcRenderer.invoke(IpcMessages.MEMORY_REJECT, id),

  // Identity
  getIdentity: () => ipcRenderer.invoke(IpcMessages.IDENTITY_GET),
  setIdentity: (data: {
    name: string;
    vibe: string;
    emoji: string;
    mission: string;
  }) => ipcRenderer.invoke(IpcMessages.IDENTITY_SET, data),

  // User Profile
  getUser: () => ipcRenderer.invoke(IpcMessages.USER_GET),
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
  }) => ipcRenderer.invoke(IpcMessages.USER_SET, data),

  // Desktop Tools
  executeTool: (toolName: string, args: Record<string, any>) =>
    ipcRenderer.invoke(IpcMessages.DESKTOP_TOOL_EXECUTE, toolName, args),
  getToolSchema: () => ipcRenderer.invoke(IpcMessages.DESKTOP_TOOL_GET_SCHEMA),

  // Web Tools
  webSearch: (query: string, numResults?: number) =>
    ipcRenderer.invoke(IpcMessages.WEB_SEARCH, query, numResults),
  fetchUrl: (url: string) => ipcRenderer.invoke(IpcMessages.FETCH_URL, url),

  // Ollama
  checkOllama: (host?: string) =>
    ipcRenderer.invoke(IpcMessages.CHECK_OLLAMA, host),

  // Provider helpers
  testProviderConnection: (
    provider: string,
    opts?: { host?: string; apiUrl?: string; apiKey?: string },
  ) => ipcRenderer.invoke(IpcMessages.TEST_PROVIDER_CONNECTION, provider, opts),
  listProviderModels: (
    provider: string,
    opts?: { host?: string; apiUrl?: string; apiKey?: string },
  ) => ipcRenderer.invoke(IpcMessages.LIST_PROVIDER_MODELS, provider, opts),

  // Skills
  checkSkillStatuses: () =>
    ipcRenderer.invoke(IpcMessages.CHECK_SKILL_STATUSES),

  // TTS
  ttsSpeak: (text: string, voice?: string) =>
    ipcRenderer.invoke("clippy_tts_speak", text, voice),
  ttsGetVoices: () => ipcRenderer.invoke("clippy_tts_get_voices"),
  ttsSpeakThai: (text: string) =>
    ipcRenderer.invoke("clippy_tts_speak_thai", text),
};

contextBridge.exposeInMainWorld("clippy", clippyApi);
