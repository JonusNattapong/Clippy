#

<p align="center">
  <img src="assets/icon.png" alt="Clippy" width="120" />
</p>

# Clippy

Clippy brings back the 90s office assistant as a modern AI desktop companion.

[![Build Status](https://github.com/JonusNattapong/Clippy/actions/workflows/ci.yml/badge.svg)](https://github.com/JonusNattapong/Clippy/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

## Summary

Clippy is a desktop app inspired by Microsoft Clippy, reimagined as a modern AI assistant. Built with Electron, React and TypeScript, it connects to LLM providers (Gemini, OpenAI, Anthropic, OpenRouter, Ollama, and Local LLM via node-llama-cpp) via API.

## Features

- **Local persistent memory** - Conversations and memories stored locally
- **Multiple AI providers** - Gemini, OpenAI, Anthropic, OpenRouter, **Ollama (local)**, **Local LLM (node-llama-cpp)**
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
- For Local LLM provider: GGUF model files downloaded to `%APPDATA%\Clippy\models\` (Windows) or `~/Library/Application Support/Clippy/models/` (macOS)

## Quick Start (Developer)

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci
cp .env.example .env
# Edit .env to add API keys for cloud providers (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY)
# For Oll

## Quick Install

Download the latest packaged release from the GitHub Releases page:

- **Windows (PowerShell)**  
  `powershell -Command "irm https://github.com/JonusNattapong/Clippy/releases/latest | Out-Null; Start-Process 'https://github.com/JonusNattapong/Clippy/releases/latest'"`
- **Windows (cmd.exe)**  
  `start https://github.com/JonusNattapong/Clippy/releases/latest`
- **macOS / Linux**  
  `xdg-open https://github.com/JonusNattapong/Clippy/releases/latest 2>/dev/null || open https://github.com/JonusNattapong/Clippy/releases/latest`

If you want a direct asset instead of the release page, use the platform links in `docs/` or the GitHub release assets list.

## Project Structure

```
src/
├── bubble-message-config.ts      # Shared bubble message prompt/config
├── ipc-messages.ts               # IPC communication definitions
├── main/                         # Electron main process
│   ├── skills/                   # Skills/Plugins system
│   ├── chat-provider.ts          # LLM streaming + prompt augmentation
│   ├── provider-service.ts       # Provider connection/model listing helpers
│   ├── desktop-tools.ts          # Desktop commands implementation
│   ├── web-tools.ts              # Web search tools
│   ├── memory.ts                 # Memory manager + maintenance
│   ├── memory-helpers.ts         # Memory extraction/policy helpers
│   ├── memory-vector-store.ts    # Semantic retrieval index
│   ├── notification-service.ts   # Telegram notification delivery
│   ├── logger.ts                 # Main-process logging
│   ├── tts.ts                    # Text-to-speech
│   ├── windows.ts                # Window management
│   ├── chats.ts                  # Chat history management
│   ├── state.ts                  # App state
│   └── ipc.ts                    # IPC handlers
├── renderer/                     # React UI (frontend)
│   ├── components/               # App windows and UI components
│   ├── hooks/                    # React hooks (commands, errors, telegram)
│   ├── helpers/                  # Parsing, labels, UI helpers
│   ├── contexts/                 # Shared React contexts
│   ├── api/                      # Renderer-side API integrations
│   ├── clippyApi.tsx             # Typed renderer bridge
│   └── preload.ts                # Electron preload bridge
├── helpers/                      # Shared utilities
└── types/                        # TypeScript contracts/interfaces
```

## Architecture

```text
User
  |
  v
Renderer Chat.tsx
  |
  +--> Memory command? (remember / forget)
  |      |
  |      v
  |    IPC MEMORY_HANDLE_COMMAND
  |      |
  |      v
  |    Main Process -> MemoryManager -> local response
  |
  +--> IPC chat request
         |
         v
      Main Process
         |
         v
      buildAugmentedSystemPrompt
         |
         +--> MemoryManager.getMemoriesWithBudget()
         |      |
         |      +--> memory.json
         |      |
         |      +--> vector-index.json
         |
         v
      AI Provider
         |
         v
      Assistant Response
         |
         v
      Renderer response parser
         |
         +--> [MEMORY_UPDATE] -> IPC MEMORY_SUBMIT_CANDIDATE
         |                        |
         |                        v
         |                    submitMemoryCandidate()
         |                        |
         |                        +--> save active memory
         |                        |
         |                        +--> save candidate memory
         |                               |
         |                               v
         |                            memory.json
         |
         +--> processConversationTurn()
         |      |
         |      +--> extractMemoryCandidates()
         |      +--> update bond / happiness / mood
         |      +--> save to memory.json
         |
         +--> tool calls -> recordActionOutcome() -> memory.json

Maintenance
  |
  v
runMaintenance()
  |
  +--> deduplicate
  +--> expire
  +--> summarize
  |
  +--> update memory.json
  +--> refresh vector-index.json
```

## Important Scripts

| Script            | Description                     |
| ----------------- | ------------------------------- |
| `npm run start`   | Start development server        |
| `npm run lint`    | Format code with Prettier       |
| `npm test`        | Run test suite                  |
| `npm run package` | Package app without installer   |
| `npm run make`    | Create distributable installers |
| `npm run publish` | Publish packaged releases       |

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

| File                         | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `config.json`                | App settings                                    |
| `memories/memory.json`       | Memory store for active, candidate, and history |
| `memories/vector-index.json` | Semantic retrieval index for memories           |
| `chats/`                     | Chat history                                    |
| `identity.json`              | Clippy identity settings                        |
| `user.json`                  | User profile                                    |
| `skills/`                    | Custom skills                                   |
| `logs/`                      | PowerShell command logs                         |

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

## Message Parsing Features

Clippy's AI responses can include special commands embedded in the response:

- **[MEMORY_UPDATE:category|content|importance]** - Submit a memory candidate through memory policy
- **[STATS_UPDATE:{bond:±X, happiness:±Y}]** - Update mood stats
- **[TOOL_CALL:tool_name|arg1=value1,arg2=value2]** - Execute tools
- **[TODO_ADD:title|note]** - Add todo item
- **[CHOICE:prompt|option1|option2|...]** - Show choice dialog
- **[AnimationKey]** - Set animation (e.g., [Wave], [Think])

## Documentation

- [`INSTALL.md`](INSTALL.md) - Installation guide
- [`USAGE.md`](USAGE.md) - Usage examples
- [`API.md`](API.md) - API documentation
- [`docs/skills.md`](docs/skills.md) - Skills system documentation
- [`docs/getting-started.md`](docs/getting-started.md) - Getting started guide
- [`docs/lang/TH-th/README.th.md`](docs/lang/TH-th/README.th.md) - Thai translation

## Acknowledgements

Thanks to:

- I am so grateful to Microsoft - not only for everything they've done for Electron, but also for giving us one of the most iconic characters and designs of computing history.
- [Kevan Atteberry](https://www.kevanatteberry.com/) for Clippy
- [Jordan Scales (@jdan)](https://github.com/jdan) for the Windows 98 design
- [Pooya Parsa (@pi0)](https://github.com/pi0) for being the (as far as I know) person to extract the length of each frame from the Clippy spritesheet.

## License

This repository's source code is licensed under the MIT License. See [`LICENSE.md`](LICENSE.md) for the full license text.

Please note:

- The MIT license applies only to the original code written in this repository.
- Any Clippy character artwork, images, icons, or other assets that are owned by Microsoft (or third parties) are not covered by the MIT license and may remain subject to separate copyright or trademark restrictions. These assets are included for nostalgic/educational purposes; obtain the necessary permissions before redistributing Microsoft-owned assets.
- When redistributing binaries, installers, or modified versions, include `LICENSE.md` and preserve the copyright notice.
