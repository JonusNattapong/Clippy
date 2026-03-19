import Store from "electron-store";
import fs from "fs";
import path from "path";
import { app } from "electron";

import {
  getChatWindow,
  getMainWindow,
  setFont,
  setFontSize,
  setTheme,
} from "./windows";
import { IpcMessages } from "../ipc-messages";
import {
  API_PROVIDER_DEFAULT_MODELS,
  ApiProvider,
  EMPTY_SHARED_STATE,
  SettingsState,
  SharedState,
} from "../sharedState";
import { getLogger } from "./logger";
import { setupAppMenu } from "./menu";
import { getNotificationManager } from "./notification-service";

function resolveDefaultApiKey(provider: ApiProvider): string {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || "";
    case "kilo":
      return process.env.KILO_API_KEY || "";
    case "ollama":
      return ""; // Ollama doesn't need an API key (runs locally)
    case "gemini":
    default:
      return (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        ""
      );
  }
}

export class StateManager {
  public store = new Store<SharedState>({
    defaults: {
      ...EMPTY_SHARED_STATE,
    },
  });

  constructor() {
    this.ensureCorrectSettingsState();

    this.store.onDidAnyChange(this.onDidAnyChange);

    // Handle settings changes
    this.store.onDidChange("settings", (newValue, oldValue) => {
      this.onSettingsChange(newValue, oldValue);
    });
  }

  private ensureCorrectSettingsState() {
    const settings = this.store.get("settings");

    if (settings.topK === undefined) {
      settings.topK = 10;
    }

    if (settings.temperature === undefined) {
      settings.temperature = 0.7;
    }

    if (!settings.apiProvider) {
      settings.apiProvider = "gemini";
    }

    if (!settings.apiModel?.trim()) {
      settings.apiModel = API_PROVIDER_DEFAULT_MODELS[settings.apiProvider];
    }

    if (!settings.apiKey?.trim() && settings.geminiApiKey?.trim()) {
      settings.apiKey = settings.geminiApiKey.trim();
    }

    if (!settings.geminiApiKey?.trim() && settings.apiProvider === "gemini") {
      settings.geminiApiKey = settings.apiKey || resolveDefaultApiKey("gemini");
    }

    if (!settings.apiKey?.trim()) {
      settings.apiKey = resolveDefaultApiKey(settings.apiProvider);
    }

    if (
      settings.apiProvider === "gemini" &&
      settings.apiKey &&
      !settings.geminiApiKey
    ) {
      settings.geminiApiKey = settings.apiKey;
    }

    if (settings.hasCompletedOnboarding === undefined) {
      settings.hasCompletedOnboarding = hasExistingSetup(settings);
    }

    if (!settings.clippyMood) {
      settings.clippyMood = EMPTY_SHARED_STATE.settings.clippyMood;
    }

    if (settings.clippyMoodIntensity === undefined) {
      settings.clippyMoodIntensity =
        EMPTY_SHARED_STATE.settings.clippyMoodIntensity;
    }

    if (settings.clippySocialBattery === undefined) {
      settings.clippySocialBattery =
        EMPTY_SHARED_STATE.settings.clippySocialBattery;
    }

    if (!settings.clippyResponseStyle) {
      settings.clippyResponseStyle =
        EMPTY_SHARED_STATE.settings.clippyResponseStyle;
    }

    if (!settings.clippyUserTone) {
      settings.clippyUserTone = EMPTY_SHARED_STATE.settings.clippyUserTone;
    }

    if (!settings.powerShellMode) {
      settings.powerShellMode = EMPTY_SHARED_STATE.settings.powerShellMode;
    }

    if (settings.telegramNotificationsEnabled === undefined) {
      settings.telegramNotificationsEnabled =
        EMPTY_SHARED_STATE.settings.telegramNotificationsEnabled;
    }

    if (settings.telegramBotToken === undefined) {
      settings.telegramBotToken = EMPTY_SHARED_STATE.settings.telegramBotToken;
    }

    if (settings.telegramChatId === undefined) {
      settings.telegramChatId = EMPTY_SHARED_STATE.settings.telegramChatId;
    }

    if (settings.telegramAllowedChatIds === undefined) {
      settings.telegramAllowedChatIds =
        EMPTY_SHARED_STATE.settings.telegramAllowedChatIds;
    }

    if (settings.telegramQuietHoursStart === undefined) {
      settings.telegramQuietHoursStart =
        EMPTY_SHARED_STATE.settings.telegramQuietHoursStart;
    }

    if (settings.telegramQuietHoursEnd === undefined) {
      settings.telegramQuietHoursEnd =
        EMPTY_SHARED_STATE.settings.telegramQuietHoursEnd;
    }

    if (settings.telegramMaxPerHour === undefined) {
      settings.telegramMaxPerHour =
        EMPTY_SHARED_STATE.settings.telegramMaxPerHour;
    }

    if (settings.telegramTodoRemindersEnabled === undefined) {
      settings.telegramTodoRemindersEnabled =
        EMPTY_SHARED_STATE.settings.telegramTodoRemindersEnabled;
    }

    if (settings.telegramTodoReminderMinutes === undefined) {
      settings.telegramTodoReminderMinutes =
        EMPTY_SHARED_STATE.settings.telegramTodoReminderMinutes;
    }

    if (settings.telegramNotifyOnTodoComplete === undefined) {
      settings.telegramNotifyOnTodoComplete =
        EMPTY_SHARED_STATE.settings.telegramNotifyOnTodoComplete;
    }

    if (settings.telegramNotifyOnErrors === undefined) {
      settings.telegramNotifyOnErrors =
        EMPTY_SHARED_STATE.settings.telegramNotifyOnErrors;
    }

    if (settings.telegramAgentNotificationsEnabled === undefined) {
      settings.telegramAgentNotificationsEnabled =
        EMPTY_SHARED_STATE.settings.telegramAgentNotificationsEnabled;
    }

    this.store.set("settings", settings);
  }

  /**
   * Handles settings changes.
   *
   * @param newValue
   * @param oldValue
   */
  private onSettingsChange(newValue: SettingsState, oldValue?: SettingsState) {
    if (!oldValue) {
      return;
    }

    if (oldValue.clippyAlwaysOnTop !== newValue.clippyAlwaysOnTop) {
      getMainWindow()?.setAlwaysOnTop(newValue.clippyAlwaysOnTop);
    }

    if (oldValue.chatAlwaysOnTop !== newValue.chatAlwaysOnTop) {
      getChatWindow()?.setAlwaysOnTop(newValue.chatAlwaysOnTop);
    }

    if (oldValue.defaultFontSize !== newValue.defaultFontSize) {
      setFontSize(newValue.defaultFontSize);
    }

    if (oldValue.defaultFont !== newValue.defaultFont) {
      setFont(newValue.defaultFont);
    }

    if (oldValue.themePreset !== newValue.themePreset) {
      setTheme(newValue.themePreset);
    }

    getNotificationManager().handleSettingsChange(newValue, oldValue);

    // Update the menu, which contains state
    setupAppMenu();

    // Log the settings change by getting a deep diff
    const diff = Object.keys(newValue).reduce(
      (acc, key) => {
        const typedKey = key as keyof SettingsState;
        if (newValue[typedKey] !== oldValue[typedKey]) {
          acc[typedKey] = newValue[typedKey];
        }

        return acc;
      },
      {} as Record<string, unknown>,
    );
    getLogger().info("Settings changed", diff);
  }

  /**
   * Notifies the renderer that the state has changed.
   *
   * @param newValue
   */
  public onDidAnyChange(newValue: SharedState = this.store.store) {
    getMainWindow()?.webContents.send(IpcMessages.STATE_CHANGED, newValue);
  }
}

function hasExistingSetup(settings: SettingsState) {
  if (
    settings.apiKey?.trim() ||
    settings.geminiApiKey?.trim() ||
    settings.tavilyApiKey?.trim() ||
    settings.clippyPosition ||
    settings.defaultFont !== EMPTY_SHARED_STATE.settings.defaultFont ||
    settings.defaultFontSize !== EMPTY_SHARED_STATE.settings.defaultFontSize ||
    settings.themePreset !== EMPTY_SHARED_STATE.settings.themePreset ||
    settings.uiLanguage !== EMPTY_SHARED_STATE.settings.uiLanguage ||
    JSON.stringify(settings.customTheme) !==
      JSON.stringify(EMPTY_SHARED_STATE.settings.customTheme)
  ) {
    return true;
  }

  const chatsDir = path.join(app.getPath("userData"), "chats");
  try {
    return fs.existsSync(chatsDir) && fs.readdirSync(chatsDir).length > 0;
  } catch {
    return false;
  }
}

let _stateManager: StateManager | null = null;

export function getStateManager() {
  if (!_stateManager) {
    _stateManager = new StateManager();
  }

  return _stateManager;
}
