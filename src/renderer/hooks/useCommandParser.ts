import { useCallback } from "react";
import { clippyApi } from "../clippyApi";
import {
  CommandHandlerResult,
  CommandStreamChunk,
  executeChatCommand,
  executeChatCommandStreaming,
} from "../helpers/chat-command-parser";

export const useCommandParser = () => {
  const handleDesktopCommand = useCallback(
    async (message: string): Promise<CommandHandlerResult> => {
      return executeChatCommand(clippyApi, message);
    },
    [],
  );

  const handleDesktopCommandStreaming = useCallback(
    (message: string) => executeChatCommandStreaming(clippyApi, message),
    [],
  );

  return { handleDesktopCommand, handleDesktopCommandStreaming };
};

export { executeChatCommand as handleDesktopCommand };
export { executeChatCommandStreaming as handleDesktopCommandStreaming };
export type { CommandHandlerResult, CommandStreamChunk };
