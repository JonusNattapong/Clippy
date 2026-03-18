import { useCallback } from "react";
import { clippyApi } from "../clippyApi";
import {
  CommandHandlerResult,
  executeChatCommand,
} from "../helpers/chat-command-parser";

export const useCommandParser = () => {
  const handleDesktopCommand = useCallback(
    async (message: string): Promise<CommandHandlerResult> => {
      return executeChatCommand(clippyApi, message);
    },
    [],
  );

  return { handleDesktopCommand };
};

export { executeChatCommand as handleDesktopCommand };
export type { CommandHandlerResult };
