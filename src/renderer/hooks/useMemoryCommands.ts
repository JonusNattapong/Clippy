import { useCallback } from "react";
import { clippyApi } from "../clippyApi";

export type MemoryCommandResult = {
  handled: boolean;
  response?: string;
};

async function executeMemoryCommand(
  message: string,
  userMessageId: string,
): Promise<MemoryCommandResult> {
  try {
    const result = await clippyApi.handleMemoryCommand(message, userMessageId);
    return result;
  } catch (error) {
    console.error("Error handling memory command:", error);
    return { handled: false };
  }
}

export const useMemoryCommands = () => {
  const handleMemoryCommand = useCallback(
    async (
      message: string,
      userMessageId: string,
    ): Promise<MemoryCommandResult> => {
      return executeMemoryCommand(message, userMessageId);
    },
    [],
  );

  return { handleMemoryCommand };
};

export { executeMemoryCommand as handleMemoryCommand };
