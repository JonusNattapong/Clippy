import { useTelegramNotifications } from "./useTelegramNotifications";
import { useCallback } from "react";

export interface ErrorContext {
  operation: string;
  recoverable?: boolean;
  notifyTelegram?: boolean;
}

export function useErrorHandler() {
  const { sendErrorNotification } = useTelegramNotifications();

  const handleError = useCallback(
    async (error: unknown, context: ErrorContext) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[${context.operation}] Error:`, errorMessage);

      if (context.notifyTelegram) {
        const truncatedMessage =
          `${context.operation} error: ${errorMessage}`.slice(0, 320);
        await sendErrorNotification(truncatedMessage);
      }

      return errorMessage;
    },
    [sendErrorNotification],
  );

  const handleToolError = useCallback(
    async (toolName: string, error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[Tool Error] ${toolName}:`, errorMessage);

      const truncatedMessage = `Tool ${toolName} failed: ${errorMessage}`.slice(
        0,
        320,
      );
      await sendErrorNotification(truncatedMessage);

      return errorMessage;
    },
    [sendErrorNotification],
  );

  const handleAsyncError = useCallback(
    async <T>(
      promise: Promise<T>,
      context: ErrorContext,
    ): Promise<T | null> => {
      try {
        return await promise;
      } catch (error) {
        await handleError(error, context);
        return null;
      }
    },
    [handleError],
  );

  return {
    handleError,
    handleToolError,
    handleAsyncError,
  };
}

export function formatErrorMessage(error: unknown, operation: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return `❌ ${operation}: ${message}`;
}

export function truncateForTelegram(message: string, maxLength = 320): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 3) + "...";
}
