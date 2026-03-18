import { clipboard, Data, ipcMain, app, dialog } from "electron";
import path from "path";
import fs from "fs";
import {
  toggleChatWindow,
  maximizeChatWindow,
  minimizeChatWindow,
  getMainWindow,
  getMainWindowPosition,
  setMainWindowPosition,
} from "./windows";
import { IpcMessages } from "../ipc-messages";
import { getStateManager } from "./state";
import { getChatManager } from "./chats";
import {
  ChatWithMessages,
  MemoryFilter,
  MemoryStats,
} from "../types/interfaces";
import { getMainAppMenu } from "./menu";
import { checkForUpdates } from "./update";
import { getVersions } from "./helpers/getVersions";
import { getDebugManager } from "./debug";
import { getMemoryManager } from "./memory";
import { executeTool, DESKTOP_TOOLS, openPowerShellLog } from "./desktop-tools";
import { webSearch, fetchUrl, WEB_TOOLS } from "./web-tools";
import {
  API_PROVIDER_DEFAULT_MODELS,
  SharedState,
  ApiProvider,
} from "../sharedState";
import { streamChatCompletion, transcribeAudio } from "./chat-provider";

interface IdentityData {
  name: string;
  vibe: string;
  emoji: string;
  mission: string;
}

interface UserData {
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
}

const DEFAULT_IDENTITY: IdentityData = {
  name: "Clippy",
  vibe: "Warm, friendly, caring, slightly playful",
  emoji: "📎",
  mission:
    "To be the kind of AI friend that actually remembers what matters to you",
};

const DEFAULT_USER: UserData = {
  name: "",
  nickname: "",
  pronouns: "",
  timezone: "",
  language: "Thai / English",
  communicationStyle: "",
  responseLength: "Medium",
  tone: "Casual",
  topicsToAvoid: "",
  notes: "",
};

interface BackupPayload {
  version: number;
  exportedAt: string;
  state: SharedState;
  memories: ReturnType<ReturnType<typeof getMemoryManager>["getMemoryBank"]>;
  chats: ChatWithMessages[];
  identity: IdentityData;
  user: UserData;
}

type StreamStartPayload = {
  requestId: string;
  provider?: ApiProvider;
  model?: string;
  systemPrompt: string;
  message: string;
  images?: string[];
  history: ChatWithMessages["messages"];
  temperature?: number;
  topK?: number;
};

const activeChatStreams = new Map<string, AbortController>();

function getIdentityPath(): string {
  return path.join(app.getPath("userData"), "identity.json");
}

function getUserPath(): string {
  return path.join(app.getPath("userData"), "user.json");
}

function readJsonFile<T>(filePath: string, defaults: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return { ...defaults, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaults;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    throw e;
  }
}

function syncMemoryStatsToSettings(stats: MemoryStats) {
  const stateManager = getStateManager();
  stateManager.store.set("settings.bondLevel", stats.bondLevel);
  stateManager.store.set("settings.happiness", stats.happiness);
  stateManager.store.set("settings.clippyMood", stats.mood.primary);
  stateManager.store.set("settings.clippyMoodIntensity", stats.mood.intensity);
  stateManager.store.set(
    "settings.clippySocialBattery",
    stats.mood.socialBattery,
  );
  stateManager.store.set(
    "settings.clippyResponseStyle",
    stats.mood.responseStyle,
  );
  stateManager.store.set("settings.clippyUserTone", stats.mood.userTone);
}

function resolveProviderApiKey(provider: ApiProvider) {
  const settings = getStateManager().store.get("settings");
  if (provider === "gemini") {
    return (settings.geminiApiKey || settings.apiKey || "").trim();
  }

  return (settings.apiKey || "").trim();
}

export function setupIpcListeners() {
  // Window
  ipcMain.handle(IpcMessages.TOGGLE_CHAT_WINDOW, () => toggleChatWindow());
  ipcMain.handle(IpcMessages.MINIMIZE_CHAT_WINDOW, () => minimizeChatWindow());
  ipcMain.handle(IpcMessages.MAXIMIZE_CHAT_WINDOW, () => maximizeChatWindow());
  ipcMain.handle(IpcMessages.MINIMIZE_MAIN_WINDOW, () => {
    getMainWindow()?.minimize();
  });
  ipcMain.handle(IpcMessages.MAXIMIZE_MAIN_WINDOW, () => {
    const mainWindow = getMainWindow();
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle(IpcMessages.CLOSE_MAIN_WINDOW, () => {
    getMainWindow()?.close();
  });
  ipcMain.handle(IpcMessages.GET_MAIN_WINDOW_POSITION, () => {
    return getMainWindowPosition();
  });
  ipcMain.handle(
    IpcMessages.SET_MAIN_WINDOW_POSITION,
    (_, x: number, y: number) => {
      setMainWindowPosition(x, y);
    },
  );
  ipcMain.handle(IpcMessages.POPUP_APP_MENU, () => getMainAppMenu().popup());

  // App
  ipcMain.handle(IpcMessages.APP_CHECK_FOR_UPDATES, () => checkForUpdates());
  ipcMain.handle(IpcMessages.APP_GET_VERSIONS, () => getVersions());
  ipcMain.handle(IpcMessages.APP_OPEN_POWERSHELL_LOG, async () => {
    const result = await openPowerShellLog();
    if (!result.success) {
      throw new Error(result.error || "Failed to open PowerShell log.");
    }
  });
  ipcMain.handle(IpcMessages.APP_EXPORT_BACKUP, async () => {
    const result = await dialog.showSaveDialog(getMainWindow(), {
      title: "Export Clippy Backup",
      defaultPath: path.join(
        app.getPath("documents"),
        `clippy-backup-${new Date().toISOString().slice(0, 10)}.json`,
      ),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state: getStateManager().store.store,
      memories: getMemoryManager().getMemoryBank(),
      chats: await getChatManager().getAllChatsWithMessages(),
      identity: readJsonFile<IdentityData>(getIdentityPath(), DEFAULT_IDENTITY),
      user: readJsonFile<UserData>(getUserPath(), DEFAULT_USER),
    };

    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), "utf8");
    return { success: true, path: result.filePath };
  });
  ipcMain.handle(IpcMessages.APP_IMPORT_BACKUP, async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: "Import Clippy Backup",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    const backupPath = result.filePaths[0];
    const payload = JSON.parse(
      fs.readFileSync(backupPath, "utf8"),
    ) as Partial<BackupPayload>;

    if (!payload.state?.settings || !payload.memories || !payload.chats) {
      throw new Error("Invalid backup file.");
    }

    getStateManager().store.set("settings", payload.state.settings);
    getMemoryManager().importMemoryBank(payload.memories);
    await getChatManager().importChats(payload.chats);
    if (payload.identity) {
      writeJsonFile(getIdentityPath(), payload.identity);
    }
    if (payload.user) {
      writeJsonFile(getUserPath(), payload.user);
    }

    return { success: true, path: backupPath };
  });

  // State
  ipcMain.handle(
    IpcMessages.STATE_GET_FULL,
    () => getStateManager().store.store,
  );
  ipcMain.handle(IpcMessages.STATE_SET, (_, key: string, value: any) =>
    getStateManager().store.set(key, value),
  );
  ipcMain.handle(IpcMessages.STATE_GET, (_, key: string) =>
    getStateManager().store.get(key),
  );
  ipcMain.handle(IpcMessages.STATE_OPEN_IN_EDITOR, () =>
    getStateManager().store.openInEditor(),
  );

  // Debug
  ipcMain.handle(
    IpcMessages.DEBUG_STATE_GET_FULL,
    () => getDebugManager().store.store,
  );
  ipcMain.handle(IpcMessages.DEBUG_STATE_SET, (_, key: string, value: any) =>
    getDebugManager().store.set(key, value),
  );
  ipcMain.handle(IpcMessages.DEBUG_STATE_GET, (_, key: string) =>
    getDebugManager().store.get(key),
  );
  ipcMain.handle(IpcMessages.DEBUG_STATE_OPEN_IN_EDITOR, () =>
    getDebugManager().store.openInEditor(),
  );

  // Chat
  ipcMain.handle(IpcMessages.CHAT_GET_CHAT_RECORDS, () =>
    getChatManager().getChats(),
  );
  ipcMain.handle(IpcMessages.CHAT_GET_CHAT_WITH_MESSAGES, (_, chatId: string) =>
    getChatManager().getChatWithMessages(chatId),
  );
  ipcMain.handle(
    IpcMessages.CHAT_WRITE_CHAT_WITH_MESSAGES,
    (_, chatWithMessages: ChatWithMessages) =>
      getChatManager().writeChatWithMessages(chatWithMessages),
  );
  ipcMain.handle(IpcMessages.CHAT_DELETE_CHAT, (_, chatId: string) =>
    getChatManager().deleteChat(chatId),
  );
  ipcMain.handle(IpcMessages.CHAT_DELETE_ALL_CHATS, () =>
    getChatManager().deleteAllChats(),
  );
  ipcMain.handle(
    IpcMessages.CHAT_STREAM_START,
    (event, payload: StreamStartPayload) => {
      const provider =
        payload.provider || getStateManager().store.get("settings.apiProvider");
      const apiKey = resolveProviderApiKey(provider);
      if (!apiKey) {
        throw new Error(`API key for ${provider} is missing.`);
      }

      const model =
        payload.model?.trim() ||
        getStateManager().store.get("settings.apiModel") ||
        API_PROVIDER_DEFAULT_MODELS[provider];
      const controller = new AbortController();
      activeChatStreams.set(payload.requestId, controller);

      void (async () => {
        try {
          for await (const chunk of streamChatCompletion({
            provider,
            apiKey,
            model,
            systemPrompt: payload.systemPrompt,
            message: payload.message,
            images: payload.images,
            history: payload.history,
            temperature: payload.temperature,
            topK: payload.topK,
            signal: controller.signal,
          })) {
            event.sender.send(IpcMessages.CHAT_STREAM_CHUNK, {
              requestId: payload.requestId,
              chunk,
            });
          }
          event.sender.send(IpcMessages.CHAT_STREAM_END, {
            requestId: payload.requestId,
          });
        } catch (error) {
          event.sender.send(IpcMessages.CHAT_STREAM_ERROR, {
            requestId: payload.requestId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          activeChatStreams.delete(payload.requestId);
        }
      })();

      return { started: true };
    },
  );
  ipcMain.handle(IpcMessages.CHAT_STREAM_ABORT, (_, requestId: string) => {
    activeChatStreams.get(requestId)?.abort();
    activeChatStreams.delete(requestId);
  });
  ipcMain.handle(
    IpcMessages.CHAT_TRANSCRIBE_AUDIO,
    async (
      _,
      payload: {
        audioBase64: string;
        mimeType: string;
        provider?: ApiProvider;
        model?: string;
      },
    ) => {
      const settings = getStateManager().store.get("settings");
      const provider =
        payload.provider ||
        (settings.apiProvider === "openai" ? "openai" : "gemini");
      const apiKey = resolveProviderApiKey(provider);
      if (!apiKey) {
        throw new Error(`API key for ${provider} is missing.`);
      }

      return transcribeAudio(payload.audioBase64, payload.mimeType, {
        provider,
        apiKey,
        model:
          payload.model ||
          (provider === "gemini"
            ? settings.apiModel || API_PROVIDER_DEFAULT_MODELS.gemini
            : undefined),
      });
    },
  );

  // Clipboard
  ipcMain.handle(IpcMessages.CLIPBOARD_WRITE, (_, data: Data) =>
    clipboard.write(data, "clipboard"),
  );

  // Memory
  ipcMain.handle(IpcMessages.MEMORY_GET_ALL, () =>
    getMemoryManager().getAllMemories(),
  );
  ipcMain.handle(IpcMessages.MEMORY_GET, (_, id: string) =>
    getMemoryManager().getMemory(id),
  );
  ipcMain.handle(
    IpcMessages.MEMORY_CREATE,
    (
      _,
      content: string,
      category: string,
      importance: number,
      source?: string,
    ) =>
      getMemoryManager().createMemory(
        content,
        category as any,
        importance,
        source,
      ),
  );
  ipcMain.handle(
    IpcMessages.MEMORY_UPDATE,
    (
      _,
      id: string,
      updates: { content?: string; category?: string; importance?: number },
    ) => getMemoryManager().updateMemory(id, updates as any),
  );
  ipcMain.handle(IpcMessages.MEMORY_DELETE, (_, id: string) =>
    getMemoryManager().deleteMemory(id),
  );
  ipcMain.handle(IpcMessages.MEMORY_SEARCH, (_, filter: MemoryFilter) =>
    getMemoryManager().searchMemories(filter),
  );
  ipcMain.handle(IpcMessages.MEMORY_GET_STATS, () =>
    getMemoryManager().getStats(),
  );
  ipcMain.handle(IpcMessages.MEMORY_UPDATE_STATS, (_, updates) => {
    const stats = getMemoryManager().updateStats(updates);
    syncMemoryStatsToSettings(stats);
    return stats;
  });
  ipcMain.handle(
    IpcMessages.MEMORY_PROCESS_TURN,
    (
      _,
      userMessage: string,
      assistantMessage: string,
      updates,
      source?: string,
    ) => {
      const stats = getMemoryManager().processConversationTurn(
        userMessage,
        assistantMessage,
        updates,
        source,
      );
      syncMemoryStatsToSettings(stats);
      return stats;
    },
  );
  ipcMain.handle(
    IpcMessages.MEMORY_HANDLE_COMMAND,
    (_, input: string, source?: string) =>
      getMemoryManager().handleExplicitMemoryCommand(input, source),
  );
  ipcMain.handle(IpcMessages.MEMORY_RUN_MAINTENANCE, () =>
    getMemoryManager().runMaintenance(),
  );
  ipcMain.handle(IpcMessages.MEMORY_DELETE_ALL, () =>
    getMemoryManager().deleteAllMemories(),
  );

  // Identity
  ipcMain.handle(IpcMessages.IDENTITY_GET, () =>
    readJsonFile<IdentityData>(getIdentityPath(), DEFAULT_IDENTITY),
  );
  ipcMain.handle(IpcMessages.IDENTITY_SET, (_, data: IdentityData) =>
    writeJsonFile(getIdentityPath(), data),
  );

  // User Profile
  ipcMain.handle(IpcMessages.USER_GET, () =>
    readJsonFile<UserData>(getUserPath(), DEFAULT_USER),
  );
  ipcMain.handle(IpcMessages.USER_SET, (_, data: UserData) =>
    writeJsonFile(getUserPath(), data),
  );

  // Desktop Tools
  ipcMain.handle(
    IpcMessages.DESKTOP_TOOL_EXECUTE,
    async (_, toolName: string, args: Record<string, any>) =>
      executeTool(toolName, args),
  );
  ipcMain.handle(IpcMessages.DESKTOP_TOOL_GET_SCHEMA, () => DESKTOP_TOOLS);

  // Web Tools
  ipcMain.handle(
    IpcMessages.WEB_SEARCH,
    async (_, query: string, numResults?: number) =>
      webSearch(query, numResults),
  );
  ipcMain.handle(IpcMessages.FETCH_URL, async (_, url: string) =>
    fetchUrl(url),
  );
}
