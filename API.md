# API / Integrations (English)

Overview

The app exposes IPC channels between renderer and main process for chat operations and settings.

IPC channels

- `chat:send`
  - payload: { text: string, metadata?: any }
- `chat:reply`
  - payload: { id: string, text: string, source: 'provider' | 'memory' }
- `settings:update`
  - payload: { key: string, value: any }

## AI Providers

### Supported Providers

| Provider      | Type  | API Key Required | Notes                     |
| ------------- | ----- | ---------------- | ------------------------- |
| Gemini        | Cloud | Yes              | Google's AI               |
| OpenAI        | Cloud | Yes              | GPT models                |
| Anthropic     | Cloud | Yes              | Claude models             |
| OpenRouter    | Cloud | Yes              | Multiple models           |
| Ollama        | Local | No               | Requires Ollama installed |
| **Local LLM** | Local | No               | **node-llama-cpp - NEW!** |

### Local LLM API (node-llama-cpp)

The Local LLM provider uses `node-llama-cpp` to run GGUF models directly in the app.

**Functions:**

```typescript
// Load a model
await loadModel(modelName: string): Promise<void>

// Unload current model
await unloadModel(): Promise<void>

// Check if model is loaded
isModelLoaded(): boolean

// Get current model name
getCurrentModelName(): string

// Generate text
for await (const chunk of generateText(prompt, options)) {
  console.log(chunk);
}

// List local models
listLocalModels(): LocalModelInfo[]

// Get recommended models
getRecommendedModels(): Array<{name, filename, url, description, size}>

// Download a model
await downloadModel(url, filename, onProgress): Promise<string>
```

**Example:**

```typescript
import { loadModel, generateText, isModelLoaded } from "./main/local-llm";

// Load model
if (!isModelLoaded()) {
  await loadModel("llama-3.2-3b-instruct");
}

// Generate response
for await (const chunk of generateText("Hello, how are you?")) {
  process.stdout.write(chunk);
}
```

Provider call (concept)

```ts
// Language: typescript
import { callProvider } from "./main/chat-provider";
const response = await callProvider({ provider: "openai", prompt: "Hello" });
console.log(response.text);
```

## Streaming Support

All AI providers support streaming responses. Commands now also support streaming:

### AI Provider Streaming

```typescript
// Streaming chat completion
for await (const chunk of streamChatCompletion({
  provider: "gemini",
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.0-flash",
  message: "Hello",
})) {
  process.stdout.write(chunk);
}
```

### Command Streaming

Desktop and web commands support streaming with progress messages:

```typescript
// Command streaming with progress updates
for await (const chunk of executeChatCommandStreaming(api, "/search query")) {
  if (chunk.type === "progress") {
    console.log("Progress:", chunk.content);
  } else if (chunk.type === "result") {
    console.log("Result:", chunk.content);
  }
}
```

### Message Parsing Directives

Clippy's AI can output special syntax:

| Format                                           | Purpose                                   |
| ------------------------------------------------ | ----------------------------------------- |
| `[MEMORY_UPDATE:category\|content\|importance]`  | Save to memory                            |
| `[STATS_UPDATE:{bond:±X, happiness:±Y}]`         | Update mood stats                         |
| `[TOOL_CALL:tool_name\|arg1=value1,arg2=value2]` | Execute tools                             |
| `[TODO_ADD:title\|note]`                         | Add todo item                             |
| `[CHOICE:prompt\|option1\|option2\|...]`         | Show choice dialog                        |
| `[AnimationKey]`                                 | Set animation (e.g., `[Wave]`, `[Think]`) |

## Security

- Store API keys in `.env` or encrypted local storage.
- Do not send API keys to renderer directly; use main process as intermediary.
- Local LLM models are stored in user data directory and work offline.

See implementation: [`src/main/chat-provider.ts`](src/main/chat-provider.ts:1), [`src/main/local-llm.ts`](src/main/local-llm.ts:1)
