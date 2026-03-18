import { useCallback } from "react";
import { clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";

export type TelegramNotificationSource = "manual" | "rule" | "agent";

export interface TelegramNotificationPayload {
  message: string;
  reason?: string;
  source: TelegramNotificationSource;
  allowDuringQuietHours?: boolean;
}

export function useTelegramNotifications() {
  const { settings } = useSharedState();

  const sendNotification = useCallback(
    async (payload: Omit<TelegramNotificationPayload, "source">) => {
      if (!settings.telegramNotificationsEnabled) {
        return { success: false, output: "Telegram notifications disabled" };
      }

      return clippyApi.sendTelegramNotification({
        ...payload,
        source: payload.source || "agent",
      });
    },
    [settings.telegramNotificationsEnabled],
  );

  const sendErrorNotification = useCallback(
    async (errorMessage: string) => {
      if (!settings.telegramNotifyOnErrors) {
        return { success: false, output: "Error notifications disabled" };
      }

      return clippyApi.sendTelegramNotification({
        reason: "error",
        message: errorMessage.slice(0, 320),
        source: "agent",
        allowDuringQuietHours: true,
      });
    },
    [settings.telegramNotifyOnErrors],
  );

  const sendManualNotification = useCallback(
    async (message: string, reason?: string) => {
      return clippyApi.sendTelegramNotification({
        message,
        reason,
        source: "manual",
        allowDuringQuietHours: true,
      });
    },
    [],
  );

  return {
    sendNotification,
    sendErrorNotification,
    sendManualNotification,
    isEnabled: settings.telegramNotificationsEnabled,
  };
}
