# USAGE (English)

Getting started

- Open the app (after `npm run start` or install).
- Go to Settings to add API keys or select a provider.

## AI Provider Selection

### Cloud Providers (Gemini, OpenAI, Anthropic, OpenRouter)

1. Go to Settings > AI Provider
2. Select your provider
3. Enter your API key
4. Choose a model from the dropdown

### Ollama (Local)

1. Install Ollama and pull a model (see INSTALL.md)
2. Go to Settings > AI Provider
3. Select "Ollama"
4. Choose a model from the list

### Local LLM (node-llama-cpp) - NEW!

1. Go to Settings > AI Provider
2. Select "Local LLM (GGUF)"
3. Choose a model from the recommended list:
   - **Llama 3.2 3B** (2.0 GB) - Fast, good for general chat
   - **Llama 3.1 8B** (4.7 GB) - Balanced performance
   - **Qwen 2.5 7B** (4.4 GB) - Good for Thai language
   - **Gemma 2 9B** (5.4 GB) - High quality from Google
   - **Phi-3.5 Mini** (2.2 GB) - Small but capable
4. Click "Download" to get the model
5. Start chatting - no internet required!

**Note:** Models are stored locally and work completely offline.

## Desktop Commands

Use these commands in chat:

| Command              | Function                 | Example                 |
| -------------------- | ------------------------ | ----------------------- |
| `/run <cmd>`         | Run PowerShell command   | `/run Get-Process`      |
| `/ls [path]`         | List directory contents  | `/ls` or `/ls C:\Users` |
| `/list <path>`       | List directory (alias)   | `/list C:\Users`        |
| `/read <file>`       | Read file content        | `/read notes.txt`       |
| `/cat <file>`        | Read file (alias)        | `/cat config.json`      |
| `/search <query>`    | Search for files locally | `/search report`        |
| `/find <query>`      | Search files (alias)     | `/find budget`          |
| `/sysinfo`           | System information       | `/sysinfo`              |
| `/ps [limit]`        | List processes           | `/ps 10`                |
| `/clipboard`         | Read clipboard           | `/clipboard`            |
| `/screenshot [name]` | Take screenshot          | `/screenshot`           |

## Web Commands

| Command           | Function              | Example                      |
| ----------------- | --------------------- | ---------------------------- |
| `/search <query>` | Web search (Tavily)   | `/search weather Bangkok`    |
| `/google <query>` | Google search (alias) | `/google Thai food`          |
| `/fetch <url>`    | Fetch webpage content | `/fetch https://example.com` |
| `/curl <url>`     | Fetch URL (alias)     | `/curl https://example.com`  |
| `/wget <url>`     | Fetch URL (alias)     | `/wget https://example.com`  |

**Note:** Web search requires Tavily API key configured in Settings.

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

- Settings > Model: choose provider (Gemini/OpenAI/Anthropic/OpenRouter/Kilo/Ollama/Local LLM), set temperature, max tokens.

Security

- Back up `memories/` and `config.json` before upgrades.
- Do not expose API keys in public repositories.
