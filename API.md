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

Provider call (concept)

```ts
// Language: typescript
import { callProvider } from "./main/chat-provider";
const response = await callProvider({ provider: "openai", prompt: "Hello" });
console.log(response.text);
```

Security

- Store API keys in `.env` or encrypted local storage.
- Do not send API keys to renderer directly; use main process as intermediary.

See implementation: [`src/main/chat-provider.ts`](src/main/chat-provider.ts:1)
