# Clippy

Clippy brings back the 90s office assistant as a modern AI desktop companion.

[![Build Status](https://github.com/JonusNattapong/Clippy/actions/workflows/ci.yml/badge.svg)](https://github.com/JonusNattapong/Clippy/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

## Summary

Clippy is a desktop app inspired by Microsoft Clippy, reimagined as a modern AI assistant. Built with Electron, React and TypeScript, it connects to LLM providers (Gemini, OpenAI, Anthropic, OpenRouter, and Ollama) via API.

## Features

- **Local persistent memory** - Conversations and memories stored locally
- **Multiple AI providers** - Gemini, OpenAI, Anthropic, OpenRouter, Ollama
- **Skills/Plugins System** - Modular plugin architecture for extending capabilities
- **Desktop commands** - Execute PowerShell commands, search files, take screenshots
- **Web search** - Search the web using Tavily API
- **Text-to-Speech** - Voice responses using edge-tts
- **Emotion/style-aware responses** - Clippy responds with personality
- **Windows 98 style UI** - Nostalgic design
- **Multi-language support** - English and Thai translations

## Requirements

- Windows 10/11, macOS or Linux
- Node.js >= 18
- npm or pnpm
- For Ollama provider: Ollama installed and running (https://ollama.ai) with a model pulled (e.g., `ollama pull llama3.2`)

## Quick Start (Developer)

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci
cp .env.example .env
# Edit .env to add API keys for cloud providers (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY)
# For Ollama (local), no API key is needed, but you must have Ollama installed and a model pulled (e.g., `ollama pull llama3.2`)
npm run start
```

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── skills/              # Skills/Plugins system
│   │   ├── index.ts         # Public API exports
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── registry.ts      # Skill registry & loader
│   │   ├── system.skill.ts  # System skill
│   │   └── web.skill.ts     # Web skill
│   ├── chat-provider.ts     # AI chat providers
│   ├── desktop-tools.ts     # Desktop commands
│   ├── web-tools.ts         # Web search tools
│   ├── memory.ts            # Memory management
│   ├── tts.ts               # Text-to-speech
│   └── windows.ts           # Window management
├── renderer/                # React UI (frontend)
├── helpers/                 # Shared utilities
├── types/                   # TypeScript definitions
└── ipc-messages.ts          # IPC communication
```

## Important Scripts

| Script            | Description                     |
| ----------------- | ------------------------------- |
| `npm run start`   | Start development server        |
| `npm run build`   | Build for production            |
| `npm run lint`    | Format code with Prettier       |
| `npm test`        | Run test suite                  |
| `npm run package` | Package app without installer   |
| `npm run make`    | Create distributable installers |

## Skills System

Clippy includes a modular Skills/Plugins system for extending capabilities:

### Built-in Skills

| Skill    | Actions                                               |
| -------- | ----------------------------------------------------- |
| `system` | `get_info`, `list_processes`, `get_env`, `get_uptime` |
| `web`    | `search`, `fetch_url`                                 |

### Creating Custom Skills

```typescript
// skills/my-skill/index.js
module.exports.default = function createMySkill() {
  return {
    meta: {
      id: "my-skill",
      name: "My Skill",
      version: "1.0.0",
      description: "Custom skill description",
    },
    actions: {
      my_action: {
        meta: { name: "my_action", description: "..." },
        execute: async (args) => {
          return { success: true, output: "Done" };
        },
      },
    },
  };
};
```

Place custom skills in `%APPDATA%\Clippy\skills\` (Windows) or `~/Library/Application Support/Clippy/skills/` (macOS).

See [`docs/skills.md`](docs/skills.md) for full documentation.

## User Data Location

| Platform | Path                                    |
| -------- | --------------------------------------- |
| Windows  | `%APPDATA%\Clippy\`                     |
| macOS    | `~/Library/Application Support/Clippy/` |

### Stored Files

| File                   | Description              |
| ---------------------- | ------------------------ |
| `config.json`          | App settings             |
| `memories/memory.json` | Long-term memories       |
| `chats/`               | Chat history             |
| `identity.json`        | Clippy identity settings |
| `user.json`            | User profile             |
| `skills/`              | Custom skills            |
| `logs/`                | PowerShell command logs  |

## Desktop Commands

| Command              | Description              | Example                 |
| -------------------- | ------------------------ | ----------------------- |
| `/run <cmd>`         | Run PowerShell command   | `/run Get-Process`      |
| `/ls [path]`         | List directory contents  | `/ls` or `/ls C:\Users` |
| `/list <path>`       | List directory (alias)   | `/list C:\Users`        |
| `/read <file>`       | Read file content        | `/read notes.txt`       |
| `/cat <file>`        | Read file (alias)        | `/cat config.json`      |
| `/search <query>`    | Search for files (local) | `/search report`        |
| `/find <query>`      | Search files (alias)     | `/find budget`          |
| `/sysinfo`           | System information       | `/sysinfo`              |
| `/ps [limit]`        | List processes           | `/ps 10`                |
| `/screenshot [name]` | Take screenshot          | `/screenshot`           |
| `/clipboard`         | Read clipboard           | `/clipboard`            |

### Security

- **Safe mode**: Only read-only PowerShell commands allowed
- **Full mode**: Requires user confirmation before execution
- **Blocked**: Destructive commands like `Remove-Item`, `Stop-Process` are blocked
- **Logging**: All commands logged to `%APPDATA%\Clippy\logs\`

## Web Commands

| Command           | Description           | Example                      |
| ----------------- | --------------------- | ---------------------------- |
| `/search <query>` | Search the web        | `/search weather Bangkok`    |
| `/google <query>` | Google search (alias) | `/google Thai food`          |
| `/fetch <url>`    | Fetch webpage content | `/fetch https://example.com` |
| `/curl <url>`     | Fetch URL (alias)     | `/curl https://example.com`  |
| `/wget <url>`     | Fetch URL (alias)     | `/wget https://example.com`  |

**Note:** Web search requires Tavily API key configured in Settings.

## Documentation

- [`INSTALL.md`](INSTALL.md) - Installation guide
- [`USAGE.md`](USAGE.md) - Usage examples
- [`API.md`](API.md) - API documentation
- [`docs/skills.md`](docs/skills.md) - Skills system documentation
- [`TH-th/README.th.md`](TH-th/README.th.md) - Thai translation
## License

This repository's source code is licensed under the MIT License. See [`LICENSE.md`](LICENSE.md) for the full license text.

Please note:

- The MIT license applies only to the original code written in this repository.
- Any Clippy character artwork, images, icons, or other assets that are owned by Microsoft (or third parties) are not covered by the MIT license and may remain subject to separate copyright or trademark restrictions. These assets are included for nostalgic/educational purposes; obtain the necessary permissions before redistributing Microsoft-owned assets.
- When redistributing binaries, installers, or modified versions, include `LICENSE.md` and preserve the copyright notice.

