import assert from "node:assert/strict";
import test from "node:test";

import {
  desktopCommandPatterns,
  executeChatCommand,
  webCommandPatterns,
  type CommandApi,
} from "../src/renderer/helpers/chat-command-parser";

function createApi(overrides: Partial<CommandApi> = {}): CommandApi {
  return {
    executeTool: async (toolName, args) => ({
      success: true,
      output: `${toolName}:${JSON.stringify(args)}`,
    }),
    webSearch: async (query) => ({ success: true, output: `search:${query}` }),
    fetchUrl: async (url) => ({ success: true, output: `fetch:${url}` }),
    sendTelegramNotification: async ({ message }) => ({
      success: true,
      output: `telegram:${message}`,
    }),
    ...overrides,
  };
}

test("desktop command patterns include core commands", () => {
  assert.ok(
    desktopCommandPatterns.some(({ toolName }) => toolName === "run_command"),
  );
  assert.ok(
    desktopCommandPatterns.some(({ toolName }) => toolName === "read_file"),
  );
  assert.ok(
    desktopCommandPatterns.some(
      ({ toolName }) => toolName === "list_directory",
    ),
  );
  assert.ok(
    desktopCommandPatterns.some(
      ({ toolName }) => toolName === "list_processes",
    ),
  );
});

test("web command patterns include search and fetch", () => {
  assert.ok(webCommandPatterns.some(({ type }) => type === "search"));
  assert.ok(webCommandPatterns.some(({ type }) => type === "fetch"));
});

test("executeChatCommand handles /run", async () => {
  let called: { toolName?: string; args?: Record<string, unknown> } = {};
  const api = createApi({
    executeTool: async (toolName, args) => {
      called = { toolName, args };
      return { success: true, output: "ok" };
    },
  });

  const result = await executeChatCommand(api, "/run Get-Process");

  assert.equal(result.handled, true);
  assert.equal(result.response, "✅ ok");
  assert.equal(called.toolName, "run_command");
  assert.deepEqual(called.args, { command: "Get-Process" });
});

test("executeChatCommand handles /ls without path", async () => {
  let calledArgs: Record<string, unknown> | undefined;
  const api = createApi({
    executeTool: async (_toolName, args) => {
      calledArgs = args;
      return { success: true, output: "listed" };
    },
  });

  const result = await executeChatCommand(api, "/ls");

  assert.equal(result.handled, true);
  assert.equal(result.response, "✅ listed");
  assert.deepEqual(calledArgs, { path: undefined });
});

test("executeChatCommand handles /ps with default limit", async () => {
  let calledArgs: Record<string, unknown> | undefined;
  const api = createApi({
    executeTool: async (_toolName, args) => {
      calledArgs = args;
      return { success: true, output: "processes" };
    },
  });

  await executeChatCommand(api, "/ps");

  assert.deepEqual(calledArgs, { limit: 20 });
});

test("executeChatCommand handles /ps with explicit limit", async () => {
  let calledArgs: Record<string, unknown> | undefined;
  const api = createApi({
    executeTool: async (_toolName, args) => {
      calledArgs = args;
      return { success: true, output: "processes" };
    },
  });

  await executeChatCommand(api, "/ps 7");

  assert.deepEqual(calledArgs, { limit: 7 });
});

test("executeChatCommand routes /google to webSearch", async () => {
  let calledQuery = "";
  const api = createApi({
    webSearch: async (query) => {
      calledQuery = query;
      return { success: true, output: "web ok" };
    },
  });

  const result = await executeChatCommand(api, "/google thai food");

  assert.equal(result.handled, true);
  assert.equal(result.response, "web ok");
  assert.equal(calledQuery, "thai food");
});

test("executeChatCommand routes /fetch to fetchUrl", async () => {
  let calledUrl = "";
  const api = createApi({
    fetchUrl: async (url) => {
      calledUrl = url;
      return { success: true, output: "page body" };
    },
  });

  const result = await executeChatCommand(api, "/fetch https://example.com");

  assert.equal(result.handled, true);
  assert.equal(result.response, "page body");
  assert.equal(calledUrl, "https://example.com");
});

test("executeChatCommand handles telegram notify", async () => {
  let message = "";
  const api = createApi({
    sendTelegramNotification: async (payload) => {
      message = payload.message;
      return { success: true, output: "sent" };
    },
  });

  const result = await executeChatCommand(api, "/notify telegram hello team");

  assert.equal(result.handled, true);
  assert.equal(result.response, "✅ sent");
  assert.equal(message, "hello team");
});

test("executeChatCommand returns formatted error response on tool failure", async () => {
  const api = createApi({
    executeTool: async () => ({ success: false, error: "denied" }),
  });

  const result = await executeChatCommand(api, "/read secret.txt");

  assert.equal(result.handled, true);
  assert.equal(result.response, "❌ denied");
});

test("executeChatCommand returns thrown error message", async () => {
  const api = createApi({
    fetchUrl: async () => {
      throw new Error("network down");
    },
  });

  const result = await executeChatCommand(api, "/fetch https://example.com");

  assert.equal(result.handled, true);
  assert.equal(result.response, "❌ Error: network down");
});

test("executeChatCommand ignores non-command messages", async () => {
  const result = await executeChatCommand(createApi(), "hello there");

  assert.deepEqual(result, { handled: false });
});
