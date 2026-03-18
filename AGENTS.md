# AGENTS.md - Clippy Development Guide

This file provides guidance for AI agents working on the Clippy codebase.

## Project Overview

Clippy is an Electron desktop application that brings back the 90s office assistant as an AI companion.
It uses React for the UI, TypeScript for type safety, and connects to various AI providers (Gemini, OpenAI, Anthropic, OpenRouter, Ollama).

**Tech Stack:**

- Electron 35.x with Vite bundler
- React 19.x with TypeScript
- electron-forge for packaging
- Prettier for formatting

## Build Commands

### Development

```bash
npm start           # Start the app in development mode (electron-forge start)
```

### Validation

```bash
npm ci              # Install dependencies exactly from package-lock.json
npm run lint        # Format all .ts/.tsx files with Prettier
npm test            # Run the Node.js test suite
```

### Packaging

```bash
npm run package     # Package the app without creating distributable
npm run make        # Create distributable installers
npm run publish     # Publish the app
```

### Linting & Formatting

```bash
npm run lint        # Run Prettier to format all .ts/.tsx files
```

**Note:** This project uses Prettier for formatting (not ESLint's --fix). Run `npm run lint` before committing.

### Tests

This project has a small Node.js test suite. Do not add new tests unless they are clearly helpful for the requested change.

## Code Style Guidelines

### TypeScript Configuration

- Target: ESNext
- Module: CommonJS
- JSX: react-jsx
- `noImplicitAny: true` - Never use implicit `any`

### Naming Conventions

- **Files:** kebab-case for files (e.g., `ipc-messages.ts`, `shared-state.ts`)
- **Components:** PascalCase for React components (e.g., `App.tsx`)
- **Variables/functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE

### Imports

- Use absolute imports when possible (configured via baseUrl in tsconfig)
- Order imports: external libs → internal modules → relative paths
- Group: React imports, then other imports, then types

### React Patterns

- Use functional components with hooks
- Use TypeScript interfaces for props
- Prefer `React.FC<Props>` for component typing when needed

### Error Handling

- Use try/catch for async operations
- Log errors with appropriate context
- Never expose sensitive information in error messages

### Prettier Formatting

The project uses Prettier with default settings. Run `npm run lint` to format:

- `.ts` and `.tsx` files
- Uses 2-space indentation

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
│   ├── desktop-tools.ts    # Desktop commands implementation
│   ├── web-tools.ts        # Web search tools
│   ├── memory.ts           # Memory management
│   ├── memory-vector-store.ts # Vector store for memories
│   ├── tts.ts              # Text-to-speech
│   ├── windows.ts          # Window management
│   ├── chats.ts            # Chat history management
│   ├── state.ts            # App state
│   └── ipc.ts              # IPC handlers
├── renderer/               # React UI (frontend)
│   ├── components/         # React components (Chat.tsx, Settings.tsx, etc.)
│   ├── hooks/              # Custom React hooks
│   │   ├── useCommandParser.ts    # Command parsing logic (desktop & web commands)
│   │   └── useMemoryCommands.ts   # Memory command handling
│   ├── helpers/            # Helper functions
│   │   └── filterMessageContent.ts # Message filtering & parsing (memory, stats, tools, todo, choice)
│   ├── contexts/           # React contexts
│   │   ├── ChatContext.tsx
│   │   ├── SharedStateContext.tsx
│   │   └── BubbleViewContext.tsx
│   └── api/                # API integrations
├── helpers/                # Shared utilities
│   └── mood-engine.ts      # Mood calculation engine
├── types/                  # TypeScript definitions
└── ipc-messages.ts         # IPC communication definitions

templates/                  # Clippy identity & personality templates
├── SOUL.md                 # Clippy's core personality
├── IDENTITY.md             # Name, vibe, emoji
├── USER.md                 # User profile template
└── TOOLS.md                # Capabilities & features
```

### Key Files

- `forge.config.js` - Electron Forge configuration
- `vite.*.config.ts` - Vite configs for main/preload/renderer
- `tsconfig.json` - TypeScript configuration

## User Data Location

User data is stored in:

- **Windows:** `%APPDATA%\Clippy\`
- **macOS:** `~/Library/Application Support\Clippy\`

### Stored Files

| File                   | Description                            |
| ---------------------- | -------------------------------------- |
| `config.json`          | App settings                           |
| `memories/memory.json` | Long-term memories                     |
| `chats/`               | Chat history                           |
| `identity.json`        | Clippy identity (editable in Settings) |
| `user.json`            | User profile (editable in Settings)    |
| `skills/`              | Custom skills                          |
| `logs/`                | PowerShell command logs                |

## Desktop Commands

AI can execute desktop tools via special chat commands. These are handled in `src/renderer/hooks/useCommandParser.ts`.

### Available Commands

| Command              | Function                 | Example                 |
| -------------------- | ------------------------ | ----------------------- |
| `/run <command>`     | Run PowerShell command   | `/run Get-Process`      |
| `/ls [path]`         | List directory contents  | `/ls` or `/ls C:\Users` |
| `/list <path>`       | List directory (alias)   | `/list C:\Users`        |
| `/read <file>`       | Read file content        | `/read notes.txt`       |
| `/cat <file>`        | Read file (alias)        | `/cat config.json`      |
| `/search <query>`    | Search for files (local) | `/search report`        |
| `/find <query>`      | Search files (alias)     | `/find budget`          |
| `/sysinfo`           | System information       | `/sysinfo`              |
| `/ps [limit]`        | List processes           | `/ps 10`                |
| `/clipboard`         | Read clipboard           | `/clipboard`            |
| `/screenshot [name]` | Take screenshot          | `/screenshot`           |

### Web Commands

| Command           | Function              | Example                      |
| ----------------- | --------------------- | ---------------------------- |
| `/search <query>` | Search the web        | `/search weather Bangkok`    |
| `/google <query>` | Google search (alias) | `/google Thai food`          |
| `/fetch <url>`    | Fetch webpage content | `/fetch https://example.com` |
| `/curl <url>`     | Fetch URL (alias)     | `/curl https://example.com`  |
| `/wget <url>`     | Fetch URL (alias)     | `/wget https://example.com`  |

**Note:** Web search requires Tavily API key configured in Settings.

### Security

- **Safe mode**: Only read-only PowerShell commands allowed
- **Full mode**: Requires user confirmation before execution
- **Blocked patterns**: Destructive commands are blocked (`Remove-Item`, `Stop-Process`, etc.)
- **Logging**: All commands logged to `%APPDATA%\Clippy\logs\powershell-history.log`

### Adding New Commands

1. Add tool implementation to `src/main/desktop-tools.ts` or `src/main/web-tools.ts`
2. Add command pattern in `src/renderer/hooks/useCommandParser.ts`:
   - Desktop commands: add to `desktopCommandPatterns` array
   - Web commands: add to `webCommandPatterns` array
3. The tool is exposed via IPC `DESKTOP_TOOL_EXECUTE` or `WEB_SEARCH`/`FETCH_URL` in `src/main/ipc.ts`

## Message Parsing Features

Clippy's AI responses can include special commands that get parsed by `src/renderer/helpers/filterMessageContent.ts`:

| Format                                           | Purpose                                   |
| ------------------------------------------------ | ----------------------------------------- |
| `[MEMORY_UPDATE:category\|content\|importance]`  | Save to memory                            |
| `[STATS_UPDATE:{bond:±X, happiness:±Y}]`         | Update mood stats                         |
| `[TOOL_CALL:tool_name\|arg1=value1,arg2=value2]` | Execute tools                             |
| `[TODO_ADD:title\|note]`                         | Add todo item                             |
| `[CHOICE:prompt\|option1\|option2\|...]`         | Show choice dialog                        |
| `[AnimationKey]`                                 | Set animation (e.g., `[Wave]`, `[Think]`) |

## Development Workflow

1. **Start development:** `npm start`
2. **Install clean dependencies when needed:** `npm ci`
3. **Run formatting:** `npm run lint`
4. **Run tests when relevant:** `npm test`
5. **Build for production:** `npm run make`
6. **Package:** `npm run package`

## GitHub Automation

- `.github/workflows/ci.yml` runs `npm ci` and `npm run lint` on pushes to `main` and on pull requests
- `.github/workflows/release.yml` builds and drafts GitHub releases only for tags matching `v*`
- `.github/workflows/pages.yml` deploys the static `docs/` site to GitHub Pages
- `.github/workflows/update-docs-release-links.yml` updates `docs/index.html` download links to the latest GitHub release assets
- `.github/ISSUE_TEMPLATE/` contains structured issue forms for bugs and feature requests

## Environment Variables

Create a `.env` file based on `.env.example` for API keys and configuration.

## Important Notes

- This is an Electron app with main/renderer process separation
- IPC communication via contextBridge (see `ipc-messages.ts`)
- Use electron-log for logging in main process
- Store user data locally using electron-store
- The docs site lives in `docs/` and is deployed separately from the Electron app
- When adding new features, consider extracting logic into hooks (`src/renderer/hooks/`) and helpers (`src/renderer/helpers/`) for better testability
