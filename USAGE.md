# USAGE (English)

Getting started

- Open the app (after `npm run start` or install).
- Go to Settings to add API keys or select a provider.

Conversation and memory tags

- Save a memory with:

```text
[MEMORY_UPDATE: fact | user_name is John | 10]
```

- Update stats with:

```text
[STATS_UPDATE: { bond: +2, happiness: +5 }]
```

IPC example (renderer -> main)

```ts
// Language: typescript
window.api.send("chat:send", { text: "Hello Clippy" });
window.api.receive("chat:reply", (reply) => console.log(reply));
```

Model selection

- Settings > Model: choose provider (Gemini/OpenAI/Anthropic/OpenRouter), set temperature, max tokens.

Security

- Back up `memories/` and `config.json` before upgrades.
- Do not expose API keys in public repositories.
