export type CommandHandlerResult = {
  handled: boolean;
  response?: string;
};

export type CommandStreamChunk = {
  type: "progress" | "result" | "error";
  content: string;
};

export type CommandApi = {
  executeTool: (
    toolName: string,
    args: Record<string, unknown>,
  ) => Promise<{ success: boolean; output?: string; error?: string }>;
  webSearch: (
    query: string,
    limit: number,
  ) => Promise<{ success: boolean; output?: string; error?: string }>;
  fetchUrl: (
    url: string,
  ) => Promise<{ success: boolean; output?: string; error?: string }>;
  sendTelegramNotification: (payload: {
    message: string;
    reason?: string;
    source: "manual" | "rule" | "agent";
    allowDuringQuietHours?: boolean;
  }) => Promise<{ success: boolean; output?: string; error?: string }>;
};

type DesktopCommandPattern = {
  pattern: RegExp;
  toolName: string;
  getArgs: (match: RegExpMatchArray) => Record<string, unknown>;
};

type WebCommandPattern = {
  pattern: RegExp;
  type: "search" | "fetch";
  getArgs: (match: RegExpMatchArray) => Record<string, unknown>;
};

export const desktopCommandPatterns: DesktopCommandPattern[] = [
  {
    pattern: /^\/notify\s+telegram\s+([\s\S]+)$/i,
    toolName: "telegram_notify_manual",
    getArgs: (match) => ({ message: match[1] }),
  },
  {
    pattern: /^\/run\s+(.+)$/i,
    toolName: "run_command",
    getArgs: (match) => ({ command: match[1] }),
  },
  {
    pattern: /^\/ls\s*(.*)$/i,
    toolName: "list_directory",
    getArgs: (match) => ({ path: match[1] || undefined }),
  },
  {
    pattern: /^\/list\s+(.+)$/i,
    toolName: "list_directory",
    getArgs: (match) => ({ path: match[1] }),
  },
  {
    pattern: /^\/read\s+(.+)$/i,
    toolName: "read_file",
    getArgs: (match) => ({ path: match[1] }),
  },
  {
    pattern: /^\/cat\s+(.+)$/i,
    toolName: "read_file",
    getArgs: (match) => ({ path: match[1] }),
  },
  {
    pattern: /^\/search\s+(.+)$/i,
    toolName: "search_files",
    getArgs: (match) => ({ query: match[1] }),
  },
  {
    pattern: /^\/find\s+(.+)$/i,
    toolName: "search_files",
    getArgs: (match) => ({ query: match[1] }),
  },
  {
    pattern: /^\/sysinfo$/i,
    toolName: "get_system_info",
    getArgs: () => ({}),
  },
  {
    pattern: /^\/ps(?:\s+(\d+))?$/i,
    toolName: "list_processes",
    getArgs: (match) => ({
      limit: match[1] ? parseInt(match[1], 10) : 20,
    }),
  },
  {
    pattern: /^\/clipboard$/i,
    toolName: "clipboard_read",
    getArgs: () => ({}),
  },
  {
    pattern: /^\/screenshot(?:\s+(.+))?$/i,
    toolName: "take_screenshot",
    getArgs: (match) => ({ name: match[1] || undefined }),
  },
  // Weather commands
  {
    pattern: /^\/weather\s+(.+)$/i,
    toolName: "weather.get_weather",
    getArgs: (match) => ({ location: match[1] }),
  },
  {
    pattern: /^\/forecast\s+(.+)$/i,
    toolName: "weather.get_weather",
    getArgs: (match) => ({ location: match[1], show_forecast: true }),
  },
  // File conversion commands
  {
    pattern: /^\/convert\s+(\S+)\s+to\s+(png|jpg|jpeg|webp|gif|tiff|avif)$/i,
    toolName: "file-conversion.convert_image",
    getArgs: (match) => ({
      input_path: match[1],
      output_format: match[2].toLowerCase(),
    }),
  },
  {
    pattern: /^\/resize\s+(\S+)\s+(\d+)x(\d+)$/i,
    toolName: "file-conversion.resize_image",
    getArgs: (match) => ({
      input_path: match[1],
      width: parseInt(match[2], 10),
      height: parseInt(match[3], 10),
    }),
  },
  {
    pattern: /^\/imginfo\s+(\S+)$/i,
    toolName: "file-conversion.get_image_info",
    getArgs: (match) => ({ input_path: match[1] }),
  },
  // System monitor commands
  {
    pattern: /^\/monitor$/i,
    toolName: "system-monitor.get_system_stats",
    getArgs: () => ({}),
  },
  {
    pattern: /^\/monitor\s+--detailed$/i,
    toolName: "system-monitor.get_system_stats",
    getArgs: () => ({ detailed: true }),
  },
  {
    pattern: /^\/top\s*(\d+)?$/i,
    toolName: "system-monitor.get_top_processes",
    getArgs: (match) => ({
      limit: match[1] ? parseInt(match[1], 10) : 10,
      sort_by: "cpu",
    }),
  },
  {
    pattern: /^\/topmem\s*(\d+)?$/i,
    toolName: "system-monitor.get_top_processes",
    getArgs: (match) => ({
      limit: match[1] ? parseInt(match[1], 10) : 10,
      sort_by: "memory",
    }),
  },
  {
    pattern: /^\/disk$/i,
    toolName: "system-monitor.check_disk_space",
    getArgs: () => ({}),
  },
];

export const webCommandPatterns: WebCommandPattern[] = [
  {
    pattern: /^\/(?:web)?search\s+(.+)$/i,
    type: "search",
    getArgs: (match) => ({ query: match[1] }),
  },
  {
    pattern: /^\/(?:google)\s+(.+)$/i,
    type: "search",
    getArgs: (match) => ({ query: match[1] }),
  },
  {
    pattern: /^\/(?:fetch|curl|wget)\s+(.+)$/i,
    type: "fetch",
    getArgs: (match) => ({ url: match[1] }),
  },
];

export async function executeChatCommand(
  api: CommandApi,
  message: string,
): Promise<CommandHandlerResult> {
  const trimmed = message.trim();

  for (const { pattern, toolName, getArgs } of desktopCommandPatterns) {
    const match = trimmed.match(pattern);
    if (!match) {
      continue;
    }

    try {
      const args = getArgs(match);
      if (toolName === "telegram_notify_manual") {
        const result = await api.sendTelegramNotification({
          message: String(args.message || ""),
          source: "manual",
          reason: "manual_command",
          allowDuringQuietHours: true,
        });

        return {
          handled: true,
          response: result.success
            ? `✅ ${result.output || "Telegram notification sent"}`
            : `❌ ${result.error || "Telegram notification failed"}`,
        };
      }

      const result = await api.executeTool(toolName, args);
      return {
        handled: true,
        response: result.success
          ? `✅ ${result.output || "Done"}`
          : `❌ ${result.error || "Error"}`,
      };
    } catch (error) {
      return {
        handled: true,
        response: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  for (const { pattern, type, getArgs } of webCommandPatterns) {
    const match = trimmed.match(pattern);
    if (!match) {
      continue;
    }

    try {
      const args = getArgs(match);
      const result =
        type === "search"
          ? await api.webSearch(String(args.query), 5)
          : await api.fetchUrl(String(args.url));

      return {
        handled: true,
        response: result.success
          ? result.output || "Done"
          : `❌ ${result.error || "Error"}`,
      };
    } catch (error) {
      return {
        handled: true,
        response: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  return { handled: false };
}

export async function* executeChatCommandStreaming(
  api: CommandApi,
  message: string,
): AsyncGenerator<CommandStreamChunk, CommandHandlerResult, undefined> {
  const trimmed = message.trim();

  for (const { pattern, toolName, getArgs } of desktopCommandPatterns) {
    const match = trimmed.match(pattern);
    if (!match) {
      continue;
    }

    try {
      const args = getArgs(match);
      if (toolName === "telegram_notify_manual") {
        yield {
          type: "progress",
          content: "📤 กำลังส่ง Telegram notification...",
        };
        const result = await api.sendTelegramNotification({
          message: String(args.message || ""),
          source: "manual",
          reason: "manual_command",
          allowDuringQuietHours: true,
        });

        const response = result.success
          ? `✅ ${result.output || "Telegram notification sent"}`
          : `❌ ${result.error || "Telegram notification failed"}`;

        yield { type: "result", content: response };
        return { handled: true, response };
      }

      yield { type: "progress", content: `⏳ กำลัง executes ${toolName}...` };
      const result = await api.executeTool(toolName, args);
      const response = result.success
        ? `✅ ${result.output || "Done"}`
        : `❌ ${result.error || "Error"}`;

      yield { type: "result", content: response };
      return { handled: true, response };
    } catch (error) {
      const response = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
      yield { type: "error", content: response };
      return { handled: true, response };
    }
  }

  for (const { pattern, type, getArgs } of webCommandPatterns) {
    const match = trimmed.match(pattern);
    if (!match) {
      continue;
    }

    try {
      const args = getArgs(match);
      if (type === "search") {
        yield { type: "progress", content: `🔍 กำลังค้นหา: ${args.query}...` };
        const result = await api.webSearch(String(args.query), 5);
        const response = result.success
          ? result.output || "Done"
          : `❌ ${result.error || "Error"}`;

        yield { type: "result", content: response };
        return { handled: true, response };
      } else {
        yield {
          type: "progress",
          content: `🌐 กำลังดึงข้อมูลจาก: ${args.url}...`,
        };
        const result = await api.fetchUrl(String(args.url));
        const response = result.success
          ? result.output || "Done"
          : `❌ ${result.error || "Error"}`;

        yield { type: "result", content: response };
        return { handled: true, response };
      }
    } catch (error) {
      const response = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
      yield { type: "error", content: response };
      return { handled: true, response };
    }
  }

  return { handled: false };
}
