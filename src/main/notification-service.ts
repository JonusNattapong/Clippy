import { SettingsState, TodoItem } from "../sharedState";
import { getLogger } from "./logger";
import {
  containsSensitiveNotificationContent,
  isWithinQuietHours,
  normalizeTelegramChatIds,
  truncateTelegramMessage,
} from "./notification-guards";

export type TelegramNotificationSource = "manual" | "rule" | "agent";

export type TelegramNotificationPayload = {
  message: string;
  reason?: string;
  source: TelegramNotificationSource;
  allowDuringQuietHours?: boolean;
};

export type TelegramNotificationResult = {
  success: boolean;
  output?: string;
  error?: string;
};

class NotificationManager {
  private currentSettings: SettingsState | null = null;
  private getSettings: (() => SettingsState) | null = null;
  private reminderInterval: NodeJS.Timeout | null = null;
  private lastTodoReminderAt = 0;
  private sentTimestamps: number[] = [];

  public start(getSettings: () => SettingsState) {
    this.getSettings = getSettings;
    this.currentSettings = getSettings();

    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }

    this.reminderInterval = setInterval(() => {
      void this.tickTodoReminders();
    }, 60 * 1000);
  }

  public handleSettingsChange(
    newSettings: SettingsState,
    oldSettings: SettingsState,
  ) {
    this.currentSettings = newSettings;

    if (!newSettings.telegramNotificationsEnabled) {
      this.lastTodoReminderAt = 0;
    }

    void this.handleTodoStateChange(
      oldSettings.todoItems || [],
      newSettings.todoItems || [],
    );
  }

  public async sendTelegramNotification(
    payload: TelegramNotificationPayload,
  ): Promise<TelegramNotificationResult> {
    const settings = this.resolveSettings();
    const checks = this.validateSend(settings, payload);
    if (checks) {
      return checks;
    }

    const botToken = this.resolveBotToken(settings);
    const chatId = this.resolveChatId(settings);
    const text = truncateTelegramMessage(payload.message);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        return {
          success: false,
          error: `Telegram send failed: ${response.status} ${responseText}`,
        };
      }

      this.recordSentTimestamp();
      getLogger().info("Telegram notification sent", {
        source: payload.source,
        reason: payload.reason,
      });

      return {
        success: true,
        output: `Telegram notification sent to ${chatId}.`,
      };
    } catch (error) {
      getLogger().error("Telegram notification failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async handleTodoStateChange(
    previousTodoItems: TodoItem[],
    nextTodoItems: TodoItem[],
  ) {
    const settings = this.resolveSettings();
    if (
      !settings.telegramNotificationsEnabled ||
      !settings.telegramNotifyOnTodoComplete
    ) {
      return;
    }

    const previousById = new Map(
      previousTodoItems.map((todoItem) => [todoItem.id, todoItem]),
    );

    for (const todoItem of nextTodoItems) {
      const previousTodoItem = previousById.get(todoItem.id);
      if (
        previousTodoItem &&
        !previousTodoItem.completed &&
        todoItem.completed
      ) {
        await this.sendTelegramNotification({
          source: "rule",
          reason: "todo_completed",
          message: `Clippy update: "${todoItem.title}" was marked done.`,
        });
      }
    }
  }

  private async tickTodoReminders() {
    const settings = this.resolveSettings();
    if (
      !settings.telegramNotificationsEnabled ||
      !settings.telegramTodoRemindersEnabled
    ) {
      return;
    }

    const reminderMinutes = Math.max(
      5,
      settings.telegramTodoReminderMinutes || 180,
    );
    const now = Date.now();
    if (now - this.lastTodoReminderAt < reminderMinutes * 60 * 1000) {
      return;
    }

    const pendingTodoItems = (settings.todoItems || []).filter(
      (todoItem) => !todoItem.completed,
    );
    if (pendingTodoItems.length === 0) {
      return;
    }

    const todoSummary = pendingTodoItems
      .slice(0, 3)
      .map((todoItem) => `- ${todoItem.title}`)
      .join("\n");
    const extraCount =
      pendingTodoItems.length > 3
        ? `\n- and ${pendingTodoItems.length - 3} more`
        : "";

    const result = await this.sendTelegramNotification({
      source: "rule",
      reason: "todo_reminder",
      message: `Clippy follow-up: you still have ${pendingTodoItems.length} pending TODOs.\n${todoSummary}${extraCount}`,
    });

    if (result.success) {
      this.lastTodoReminderAt = now;
    }
  }

  private validateSend(
    settings: SettingsState,
    payload: TelegramNotificationPayload,
  ): TelegramNotificationResult | null {
    if (!settings.telegramNotificationsEnabled) {
      return {
        success: false,
        error: "Telegram notifications are disabled in Settings.",
      };
    }

    if (
      payload.source === "agent" &&
      !settings.telegramAgentNotificationsEnabled
    ) {
      return {
        success: false,
        error: "Agent-triggered Telegram notifications are disabled.",
      };
    }

    if (
      payload.source === "rule" &&
      payload.reason?.includes("error") &&
      !settings.telegramNotifyOnErrors
    ) {
      return {
        success: false,
        error: "Error notifications are disabled.",
      };
    }

    const botToken = this.resolveBotToken(settings);
    const chatId = this.resolveChatId(settings);
    if (!botToken || !chatId) {
      return {
        success: false,
        error: "Telegram bot token or default chat ID is missing.",
      };
    }

    const allowedChatIds = normalizeTelegramChatIds(
      settings.telegramAllowedChatIds || chatId,
    );
    if (!allowedChatIds.includes(chatId)) {
      return {
        success: false,
        error: "Default Telegram chat ID is not present in the allowlist.",
      };
    }

    if (!payload.message.trim()) {
      return {
        success: false,
        error: "Notification message is empty.",
      };
    }

    if (containsSensitiveNotificationContent(payload.message)) {
      return {
        success: false,
        error:
          "Notification blocked because it appears to contain sensitive data.",
      };
    }

    if (
      payload.source !== "manual" &&
      !payload.allowDuringQuietHours &&
      isWithinQuietHours(
        new Date(),
        settings.telegramQuietHoursStart,
        settings.telegramQuietHoursEnd,
      )
    ) {
      return {
        success: false,
        error: "Notification skipped during quiet hours.",
      };
    }

    const maxPerHour = Math.max(1, settings.telegramMaxPerHour || 6);
    this.trimSentTimestamps();
    if (this.sentTimestamps.length >= maxPerHour) {
      return {
        success: false,
        error: "Telegram notification rate limit reached for this hour.",
      };
    }

    return null;
  }

  private resolveSettings() {
    if (this.currentSettings) {
      return this.currentSettings;
    }

    if (this.getSettings) {
      const settings = this.getSettings();
      this.currentSettings = settings;
      return settings;
    }

    throw new Error("Notification manager is not initialized.");
  }

  private resolveBotToken(settings: SettingsState) {
    return (
      settings.telegramBotToken?.trim() || process.env.TELEGRAM_BOT_TOKEN || ""
    );
  }

  private resolveChatId(settings: SettingsState) {
    return (
      settings.telegramChatId?.trim() || process.env.TELEGRAM_CHAT_ID || ""
    );
  }

  private recordSentTimestamp() {
    this.sentTimestamps.push(Date.now());
    this.trimSentTimestamps();
  }

  private trimSentTimestamps() {
    const cutoff = Date.now() - 60 * 60 * 1000;
    this.sentTimestamps = this.sentTimestamps.filter(
      (timestamp) => timestamp >= cutoff,
    );
  }
}

let notificationManager: NotificationManager | null = null;

export function getNotificationManager() {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }

  return notificationManager;
}
