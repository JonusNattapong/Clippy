import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

import { ApiProvider } from "../sharedState";
import { MessageRecord } from "../types/interfaces";
import { getMemoryManager } from "./memory";

export type StreamChatOptions = {
  provider: ApiProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  message: string;
  images?: string[];
  history: MessageRecord[];
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

type IdentityData = {
  name?: string;
  vibe?: string;
  emoji?: string;
  mission?: string;
};

type UserData = {
  name?: string;
  nickname?: string;
  pronouns?: string;
  timezone?: string;
  language?: string;
  communicationStyle?: string;
  responseLength?: string;
  tone?: string;
  topicsToAvoid?: string;
  notes?: string;
};

const DEFAULT_IDENTITY: IdentityData = {
  name: "Clippy",
  vibe: "Warm, friendly, caring, slightly playful",
  emoji: "📎",
  mission: "To be the kind of AI friend that actually remembers what matters",
};

const DEFAULT_USER: UserData = {
  language: "Thai / English",
  responseLength: "Medium",
  tone: "Casual",
};

const templateCache = new Map<string, string>();

function extractGeminiText(payload: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
}

function emitTextDelta(nextText: string, emittedText: string): string {
  if (!nextText) {
    return "";
  }

  if (nextText.startsWith(emittedText)) {
    return nextText.slice(emittedText.length);
  }

  return nextText;
}

function resolveGeminiModelName(model: string): string {
  const normalized = model.toLowerCase();

  if (normalized.includes("gemini-3-flash")) {
    return "gemini-3.1-flash-lite";
  }
  if (normalized.includes("gemini-3-pro")) {
    return "gemini-3.1-pro-preview";
  }
  if (normalized === "gemini-1.5-flash") {
    return "gemini-3.1-flash-lite";
  }

  return model;
}

function buildHistory(
  history: MessageRecord[],
  message: string,
  images?: string[],
): ChatMessage[] {
  const historyMessages: ChatMessage[] = history
    .filter((entry) => entry.content)
    .map((entry) => {
      if (entry.images && entry.images.length > 0) {
        const content: Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }> = [{ type: "text", text: entry.content || "" }];
        for (const img of entry.images) {
          content.push({ type: "image_url", image_url: { url: img } });
        }
        return {
          role: entry.sender === "user" ? "user" : "assistant",
          content,
        };
      }
      return {
        role: entry.sender === "user" ? "user" : "assistant",
        content: entry.content || "",
      };
    });

  if (images && images.length > 0) {
    const content: Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }> = [{ type: "text", text: message }];
    for (const img of images) {
      content.push({ type: "image_url", image_url: { url: img } });
    }
    return [...historyMessages, { role: "user", content }];
  }

  return [...historyMessages, { role: "user", content: message }];
}

function readProjectTemplate(fileName: string): string {
  const cached = templateCache.get(fileName);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const templatePath = path.join(app.getAppPath(), "templates", fileName);
    const content = fs.readFileSync(templatePath, "utf8").trim();
    templateCache.set(fileName, content);
    return content;
  } catch {
    templateCache.set(fileName, "");
    return "";
  }
}

function readLocalJson<T>(fileName: string, defaults: T): T {
  try {
    const filePath = path.join(app.getPath("userData"), fileName);
    if (!fs.existsSync(filePath)) {
      return defaults;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function buildIdentityContext(): string {
  const identity = readLocalJson<IdentityData>(
    "identity.json",
    DEFAULT_IDENTITY,
  );
  const template = readProjectTemplate("IDENTITY.md");
  const lines = [
    "Current assistant identity:",
    `Name: ${identity.name || DEFAULT_IDENTITY.name}`,
    `Emoji: ${identity.emoji || DEFAULT_IDENTITY.emoji}`,
    `Vibe: ${identity.vibe || DEFAULT_IDENTITY.vibe}`,
    `Mission: ${identity.mission || DEFAULT_IDENTITY.mission}`,
  ];

  return [template, lines.join("\n")].filter(Boolean).join("\n\n");
}

function buildUserProfileContext(): string {
  const user = readLocalJson<UserData>("user.json", DEFAULT_USER);
  const template = readProjectTemplate("USER.md");
  const lines = [
    user.name ? `Name: ${user.name}` : "",
    user.nickname ? `Nickname: ${user.nickname}` : "",
    user.pronouns ? `Pronouns: ${user.pronouns}` : "",
    user.timezone ? `Timezone: ${user.timezone}` : "",
    user.language ? `Language: ${user.language}` : "",
    user.communicationStyle
      ? `Communication style: ${user.communicationStyle}`
      : "",
    user.responseLength
      ? `Preferred response length: ${user.responseLength}`
      : "",
    user.tone ? `Preferred tone: ${user.tone}` : "",
    user.topicsToAvoid ? `Topics to avoid: ${user.topicsToAvoid}` : "",
    user.notes ? `User notes: ${user.notes}` : "",
  ].filter(Boolean);

  if (lines.length === 0) {
    return template;
  }

  return [template, "Current user profile:", lines.join("\n")]
    .filter(Boolean)
    .join("\n\n");
}

function buildSoulContext(): string {
  return readProjectTemplate("SOUL.md");
}

function buildMoodContext(): string {
  const stats = getMemoryManager().getStats();

  return [
    "Current relationship and mood state:",
    `Bond level: ${stats.bondLevel}/100`,
    `Happiness: ${stats.happiness}/100`,
    `Primary mood: ${stats.mood.primary}`,
    `Response style: ${stats.mood.responseStyle}`,
    `User tone: ${stats.mood.userTone}`,
    `Mood summary: ${stats.mood.summary}`,
  ].join("\n");
}

async function buildMemoryContext(query: string): Promise<string> {
  let memories;
  try {
    memories = await getMemoryManager().getRelevantMemoriesForQuery(query, 6);
  } catch {
    return "";
  }

  if (memories.length === 0) {
    return "";
  }

  const lines = memories.map((memory, index) => {
    const updatedAt = new Date(memory.updatedAt).toISOString().slice(0, 10);
    return `${index + 1}. [${memory.category}] importance=${memory.importance} updated=${updatedAt} ${memory.content}`;
  });

  return [
    "Relevant memory context about the user and prior interactions:",
    ...lines,
    "Use this context when it helps, but do not mention memory metadata unless the user asks.",
  ].join("\n");
}

async function buildAugmentedSystemPrompt(
  options: StreamChatOptions,
): Promise<string> {
  const sections = [
    buildSoulContext(),
    buildIdentityContext(),
    buildUserProfileContext(),
    buildMoodContext(),
    options.systemPrompt?.trim() || "",
  ].filter(Boolean);
  const memoryContext = await buildMemoryContext(options.message);

  if (memoryContext) {
    sections.push(memoryContext);
  }

  return sections.join("\n\n");
}

async function parseResponseError(response: Response): Promise<Error> {
  const text = await response.text();

  try {
    const payload = JSON.parse(text);
    const message =
      payload.error?.message || payload.message || payload.details || text;
    return new Error(
      message || `Request failed with status ${response.status}`,
    );
  } catch {
    return new Error(text || `Request failed with status ${response.status}`);
  }
}

async function* streamOpenAiCompatible(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const segments = trimmedLine.split("data: ");
      for (const segment of segments) {
        const data = segment.trim();
        if (!data || data === "[DONE]") continue;

        try {
          const payload = JSON.parse(data);
          const delta = payload.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            yield delta;
          }
        } catch {
          /* ignore partial chunks */
        }
      }
    }
  }

  if (buffer.trim().startsWith("data: ")) {
    const data = buffer.trim().slice(6).trim();
    if (data !== "[DONE]") {
      try {
        const payload = JSON.parse(data);
        const delta = payload.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        /* ignore */
      }
    }
  }
}

async function* streamAnthropic(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "));

      if (!dataLine) {
        continue;
      }

      try {
        const payload = JSON.parse(dataLine.slice(6).trim());
        const text = payload.delta?.text;
        if (typeof text === "string" && text) {
          yield text;
        }
      } catch {
        /* ignore */
      }
    }
  }
}

async function* streamGemini(options: StreamChatOptions) {
  const buildGeminiContent = (
    msg: ChatMessage,
  ): {
    role: string;
    parts: Array<{
      text?: string;
      inlineData?: { data: string; mimeType: string };
    }>;
  } => {
    const role = msg.role === "assistant" ? "model" : "user";

    if (typeof msg.content === "string") {
      return { role, parts: [{ text: msg.content }] };
    }

    const parts: Array<{
      text?: string;
      inlineData?: { data: string; mimeType: string };
    }> = [];
    for (const item of msg.content) {
      if (item.type === "text" && item.text) {
        parts.push({ text: item.text });
      } else if (item.type === "image_url" && item.image_url?.url) {
        const base64Data =
          item.image_url.url.split(",")[1] || item.image_url.url;
        const mimeType =
          item.image_url.url.match(/data:([^;]+);/)?.[1] || "image/jpeg";
        parts.push({ inlineData: { data: base64Data, mimeType } });
      }
    }

    return { role, parts };
  };

  const contents = [
    ...(options.systemPrompt
      ? [
          {
            role: "user",
            parts: [{ text: `SYSTEM INSTRUCTION: ${options.systemPrompt}` }],
          },
        ]
      : []),
    ...buildHistory(options.history, options.message, options.images).map(
      buildGeminiContent,
    ),
  ];

  const finalModel = resolveGeminiModelName(options.model);
  const versions = ["v1", "v1beta"];
  let lastError = null;

  for (const version of versions) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${finalModel}:streamGenerateContent?alt=sse&key=${options.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: options.signal,
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: options.temperature,
              topK: options.topK,
            },
          }),
        },
      );

      if (!response.ok) {
        lastError = await parseResponseError(response);
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) continue;

      const decoder = new TextDecoder();
      let buffer = "";
      let emittedText = "";
      let receivedAnyChunk = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const payload = JSON.parse(data);
            const text = extractGeminiText(payload);
            const delta = emitTextDelta(text, emittedText);

            if (delta) {
              emittedText += delta;
              receivedAnyChunk = true;
              yield delta;
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (receivedAnyChunk) return;
    } catch (error) {
      lastError = error;
    }
  }

  for (const version of versions) {
    try {
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${finalModel}:generateContent?key=${options.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: options.signal,
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: options.temperature,
              topK: options.topK,
            },
          }),
        },
      );

      if (fallbackResponse.ok) {
        const payload = await fallbackResponse.json();
        const text = extractGeminiText(payload);
        if (text) {
          yield text;
          return;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (lastError) throw lastError;
}

async function* streamOpenAi(options: StreamChatOptions) {
  const messages = [
    ...(options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : []),
    ...buildHistory(options.history, options.message, options.images),
  ];
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    signal: options.signal,
    body: JSON.stringify({
      model: options.model,
      stream: true,
      temperature: options.temperature,
      messages,
    }),
  });

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  let receivedAnyChunk = false;
  for await (const chunk of streamOpenAiCompatible(response)) {
    receivedAnyChunk = true;
    yield chunk;
  }

  if (receivedAnyChunk) {
    return;
  }

  const fallbackResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      signal: options.signal,
      body: JSON.stringify({
        model: options.model,
        temperature: options.temperature,
        messages,
      }),
    },
  );

  if (!fallbackResponse.ok) {
    throw await parseResponseError(fallbackResponse);
  }

  const payload = await fallbackResponse.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text === "string" && text) {
    yield text;
  }
}

async function* streamOpenRouter(options: StreamChatOptions) {
  const messages = [
    ...(options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : []),
    ...buildHistory(options.history, options.message, options.images),
  ];

  let finalModel = options.model.trim().toLowerCase();
  if (
    finalModel.includes("gemini-3.1-pro") ||
    finalModel.includes("gemini-3-pro")
  ) {
    finalModel = "google/gemini-3.1-pro-preview";
  } else if (
    finalModel.includes("gemini-3.1-flash") ||
    finalModel.includes("gemini-3-flash")
  ) {
    finalModel = "google/gemini-3.1-flash-lite-preview";
  } else if (!finalModel.includes("/") && finalModel.startsWith("gemini")) {
    finalModel = `google/${finalModel}`;
  }

  const rawKey = options.apiKey.trim();
  let sanitizedKey = rawKey;
  const orKeyMatch = rawKey.match(/sk-or-v1-[a-zA-Z0-9]+/);
  if (orKeyMatch) {
    sanitizedKey = orKeyMatch[0];
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sanitizedKey}`,
    "HTTP-Referer": "https://github.com/JonusNattapong/Clippy",
    "X-OpenRouter-Title": "Clippy",
  };

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers,
      signal: options.signal,
      body: JSON.stringify({
        model: finalModel,
        stream: true,
        temperature: options.temperature ?? 0.7,
        messages,
      }),
    },
  );

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  let receivedAnyChunk = false;
  for await (const chunk of streamOpenAiCompatible(response)) {
    receivedAnyChunk = true;
    yield chunk;
  }

  if (receivedAnyChunk) {
    return;
  }

  const fallbackResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers,
      signal: options.signal,
      body: JSON.stringify({
        model: finalModel,
        temperature: options.temperature ?? 0.7,
        messages,
      }),
    },
  );

  if (!fallbackResponse.ok) {
    throw await parseResponseError(fallbackResponse);
  }

  const payload = await fallbackResponse.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text === "string" && text) {
    yield text;
  }
}

const OLLAMA_DEFAULT_HOST = "http://localhost:11434";

async function* streamOllama(options: StreamChatOptions) {
  const messages = [
    ...(options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : []),
    ...buildHistory(options.history, options.message, options.images),
  ];

  const model = options.model || "llama3.2:latest";
  const host = process.env.OLLAMA_HOST || OLLAMA_DEFAULT_HOST;

  const response = await fetch(`${host}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify({
      model,
      stream: true,
      temperature: options.temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  let receivedAnyChunk = false;
  for await (const chunk of streamOpenAiCompatible(response)) {
    receivedAnyChunk = true;
    yield chunk;
  }

  if (receivedAnyChunk) {
    return;
  }

  const fallbackResponse = await fetch(`${host}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify({
      model,
      temperature: options.temperature,
      messages,
    }),
  });

  if (!fallbackResponse.ok) {
    throw await parseResponseError(fallbackResponse);
  }

  const payload = await fallbackResponse.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text === "string" && text) {
    yield text;
  }
}

async function* streamAnthropicMessages(options: StreamChatOptions) {
  const buildAnthropicContent = (
    msg: ChatMessage,
  ): {
    role: string;
    content:
      | string
      | Array<{
          type: string;
          text?: string;
          source?: { type: string; media_type: string; data: string };
        }>;
  } => {
    if (typeof msg.content === "string") {
      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      };
    }

    const content: Array<{
      type: string;
      text?: string;
      source?: { type: string; media_type: string; data: string };
    }> = [];
    for (const item of msg.content) {
      if (item.type === "text" && item.text) {
        content.push({ type: "text", text: item.text });
      } else if (item.type === "image_url" && item.image_url?.url) {
        const base64Data =
          item.image_url.url.split(",")[1] || item.image_url.url;
        const mimeType =
          item.image_url.url.match(/data:([^;]+);/)?.[1] || "image/jpeg";
        content.push({
          type: "image",
          source: { type: "base64", media_type: mimeType, data: base64Data },
        });
      }
    }

    return { role: msg.role === "assistant" ? "assistant" : "user", content };
  };

  const messages = buildHistory(
    options.history,
    options.message,
    options.images,
  ).map(buildAnthropicContent);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: options.signal,
    body: JSON.stringify({
      model: options.model,
      stream: true,
      system: options.systemPrompt || undefined,
      temperature: options.temperature,
      max_tokens: 1024,
      messages,
    }),
  });

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  let receivedAnyChunk = false;
  for await (const chunk of streamAnthropic(response)) {
    receivedAnyChunk = true;
    yield chunk;
  }

  if (receivedAnyChunk) {
    return;
  }

  const fallbackResponse = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": options.apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: options.signal,
      body: JSON.stringify({
        model: options.model,
        system: options.systemPrompt || undefined,
        temperature: options.temperature,
        max_tokens: 1024,
        messages,
      }),
    },
  );

  if (!fallbackResponse.ok) {
    throw await parseResponseError(fallbackResponse);
  }

  const payload = await fallbackResponse.json();
  const text = Array.isArray(payload.content)
    ? payload.content
        .map((part: { text?: string }) =>
          typeof part?.text === "string" ? part.text : "",
        )
        .join("")
    : "";

  if (text) {
    yield text;
  }
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  options: { provider: ApiProvider; apiKey: string; model?: string },
): Promise<string> {
  if (options.provider === "openai") {
    const formData = new FormData();
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw await parseResponseError(response);
    }

    const payload: { text?: string } = await response.json();
    return payload.text || "";
  }

  if (options.provider === "gemini") {
    const effectiveModel = resolveGeminiModelName(
      options.model || "gemini-3.1-flash-lite",
    );

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${options.apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${effectiveModel}:generateContent?key=${options.apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${options.apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${options.apiKey}`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: audioBase64,
                    },
                  },
                  {
                    text: "Accurately transcribe this audio into Thai text. Return only the transcription text.",
                  },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          const text = extractGeminiText(payload);
          if (text) {
            return text.trim();
          }
        } else {
          lastError = await parseResponseError(response);
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw (
      lastError ||
      new Error(
        "All transcription endpoints failed. Please check your API key.",
      )
    );
  }

  throw new Error(
    `Transcription not supported for provider: ${options.provider}`,
  );
}

export async function* streamChatCompletion(options: StreamChatOptions) {
  const nextOptions: StreamChatOptions = {
    ...options,
    systemPrompt: await buildAugmentedSystemPrompt(options),
  };

  switch (nextOptions.provider) {
    case "openai":
      yield* streamOpenAi(nextOptions);
      return;
    case "anthropic":
      yield* streamAnthropicMessages(nextOptions);
      return;
    case "openrouter":
      yield* streamOpenRouter(nextOptions);
      return;
    case "ollama":
      yield* streamOllama(nextOptions);
      return;
    case "gemini":
    default:
      yield* streamGemini(nextOptions);
  }
}
