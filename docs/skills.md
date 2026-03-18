# Clippy Skills System

The Skills System is a modular plugin architecture that allows extending Clippy's capabilities through dynamically loaded skills.

## Overview

Skills are self-contained modules that provide related actions. Each skill:

- Has unique metadata (id, name, version, description)
- Defines one or more actions
- Can be enabled/disabled at runtime
- Supports lifecycle hooks (init/destroy)
- Can declare dependencies on other skills

## Architecture

```
src/main/skills/
├── index.ts           # Public API exports
├── types.ts           # TypeScript interfaces
├── registry.ts        # Skill registry and loader
├── system.skill.ts    # Built-in system skill
└── web.skill.ts       # Built-in web skill
```

## Creating a Skill

### Basic Structure

```typescript
import { Skill, SkillContext, SkillResult } from "./types";

export default function createMySkill(): Skill {
  return {
    meta: {
      id: "my-skill",
      name: "My Skill",
      version: "1.0.0",
      description: "Description of what this skill does",
      author: "Your Name",
      categories: ["utility"],
      keywords: ["example", "demo"],
      enabledByDefault: true,
    },

    actions: {
      my_action: {
        meta: {
          name: "my_action",
          description: "Description of the action",
          parameters: {
            type: "object",
            properties: {
              input: {
                type: "string",
                description: "Input parameter",
              },
            },
            required: ["input"],
          },
          riskLevel: "low", // "low" | "medium" | "high"
        },
        execute: async (args, context): Promise<SkillResult> => {
          const input = String(args.input);
          return { success: true, output: `Processed: ${input}` };
        },
      },
    },

    // Optional lifecycle hooks
    init: async (context: SkillContext) => {
      context.log("My skill initialized");
    },

    destroy: async (context: SkillContext) => {
      context.log("My skill destroyed");
    },
  };
}
```

### Risk Levels

- **low**: Read-only operations, safe to execute without confirmation
- **medium**: Modifies local files or opens applications
- **high**: Destructive operations or system changes

### Actions with Confirmation

```typescript
my_action: {
  meta: { /* ... */ },
  shouldConfirm: (args) => {
    // Return true to require user confirmation
    return args.dangerous === true;
  },
  execute: async (args, context) => {
    // ...
  },
}
```

## Skill Context

The `SkillContext` provides access to application resources:

```typescript
interface SkillContext {
  app: App; // Electron app instance
  userDataPath: string; // User data directory
  homePath: string; // User home directory
  platform: NodeJS.Platform; // Operating system
  getSetting: (key: string) => unknown;
  setSetting: (key: string, value: unknown) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  log: (message: string, level?: "info" | "warn" | "error") => void;
}
```

## Built-in Skills

### System Skill (`system`)

Provides system information and control:

- `get_info` - Get CPU, memory, OS details
- `list_processes` - List running processes
- `get_env` - Get environment variable
- `get_uptime` - Get system uptime

### Web Skill (`web`)

Provides web capabilities:

- `search` - Search the web using Tavily API
- `fetch_url` - Fetch and parse webpage content

## User Skills Directory

Users can add custom skills by placing them in:

- **Windows:** `%APPDATA%\Clippy\skills\`
- **macOS:** `~/Library/Application Support/Clippy/skills/`

Each skill should be in its own folder with an `index.js` file:

```
skills/
└── my-custom-skill/
    └── index.js
```

## Using the Registry

```typescript
import { getSkillRegistry, initSkillRegistry } from "./skills";

// Initialize on app startup
await initSkillRegistry();

// Get registry instance
const registry = getSkillRegistry();

// Get all skills
const skills = registry.getSkills();

// Execute an action
const result = await registry.execute("system", "get_info", {});

// Enable/disable skills
await registry.enable("web");
await registry.disable("web");

// Get skill statuses
const statuses = registry.getStatuses();
```

## Action Naming Convention

Actions are accessed using dot notation: `skillId.actionName`

Examples:

- `system.get_info`
- `web.search`
- `web.fetch_url`

## Best Practices

1. **Unique IDs**: Use descriptive, unique skill IDs (e.g., `com.example.myskill`)
2. **Clear Descriptions**: Write clear descriptions for skills and actions
3. **Parameter Validation**: Always validate required parameters in `execute`
4. **Error Handling**: Return `{ success: false, error: "message" }` for errors
5. **Risk Assessment**: Set appropriate risk levels for actions
6. **Idempotent Actions**: Prefer idempotent operations when possible
7. **Dependency Declaration**: Use `dependencies` array for skill dependencies
