import { ClippyMood, ClippyResponseStyle, UserTone } from "./types/interfaces";

export type ApiProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "ollama"
  | "kilo"
  | "local";
export type PowerShellMode = "safe" | "full";

// Permission system types
export type PermissionLevel =
  | "none"
  | "read-only"
  | "limited"
  | "full"
  | "unrestricted";

export type PermissionCategory =
  | "file_read"
  | "file_write"
  | "file_delete"
  | "process"
  | "system"
  | "network"
  | "registry"
  | "app_control"
  | "screenshot"
  | "clipboard";

export interface PermissionConfig {
  globalLevel: PermissionLevel;
  categoryOverrides: Partial<Record<PermissionCategory, PermissionLevel>>;
  customBlockedPatterns: string[];
  customAllowedPatterns: string[];
  showConfirmations: boolean;
  enableLogging: boolean;
}

export type DefaultFont =
  | "Pixelated MS Sans Serif"
  | "Comic Sans MS"
  | "Tahoma"
  | "System Default";
export type DefaultFontSize = number;
export type ThemePreset =
  | "classic"
  | "ocean"
  | "forest"
  | "sunset"
  | "midnight"
  | "custom";
export interface WindowPosition {
  x: number;
  y: number;
}
export interface WindowBounds extends WindowPosition {
  width: number;
  height: number;
}
export interface CustomThemeColors {
  background: string;
  panel: string;
  titleBar: string;
  accent: string;
  text: string;
}
export interface TodoItem {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
export interface ThemePalette {
  bg: string;
  panel: string;
  panelSoft: string;
  surface: string;
  border: string;
  borderSoft: string;
  accent: string;
  accentGlow: string;
  text: string;
  muted: string;
  titleStart: string;
  titleEnd: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface SettingsState {
  systemPrompt?: string;
  clippyAlwaysOnTop?: boolean;
  chatAlwaysOnTop?: boolean;
  alwaysOpenChat: boolean;
  topK?: number;
  temperature?: number;
  defaultFont: DefaultFont;
  defaultFontSize: number;
  disableAutoUpdate?: boolean;
  userMemory?: string;
  bondLevel: number;
  happiness: number;
  clippyMood?: ClippyMood;
  clippyMoodIntensity?: number;
  clippySocialBattery?: number;
  clippyResponseStyle?: ClippyResponseStyle;
  clippyUserTone?: UserTone;
  powerShellMode?: PowerShellMode;
  permissionConfig?: PermissionConfig;
  apiProvider: ApiProvider;
  apiKey: string;
  apiModel: string;
  useGeminiApi: boolean;
  geminiApiKey: string;
  ollamaHost?: string;
  tavilyApiKey?: string;
  telegramNotificationsEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramAllowedChatIds?: string;
  telegramQuietHoursStart?: string;
  telegramQuietHoursEnd?: string;
  telegramMaxPerHour?: number;
  telegramTodoRemindersEnabled?: boolean;
  telegramTodoReminderMinutes?: number;
  telegramNotifyOnTodoComplete?: boolean;
  telegramNotifyOnErrors?: boolean;
  telegramAgentNotificationsEnabled?: boolean;
  ttsEnabled?: boolean;
  ttsVoice?: string;
  ttsRate?: string;
  uiLanguage?: string;
  themePreset?: ThemePreset;
  clippyPosition?: WindowPosition;
  chatWindowBounds?: WindowBounds;
  customTheme?: CustomThemeColors;
  todoItems?: TodoItem[];
  hasCompletedOnboarding?: boolean;
  memoryAutoApprove?: boolean;
}

export interface SharedState {
  settings: SettingsState;
}

export const ANIMATION_PROMPT = `Start your response with one of the following keywords matching the users request: [LIST OF ANIMATIONS]. Use only one of the keywords for each response. Use it only at the beginning of your response. Always start with one.`;
export const API_PROVIDER_DEFAULT_MODELS: Record<ApiProvider, string> = {
  gemini: "gemini-3.1-flash-lite",
  openai: "gpt-5-mini-preview",
  anthropic: "claude-3-sonnet-5",
  openrouter: "openai/gpt-4o-mini",
  ollama: "llama3.2:latest",
  kilo: "anthropic/claude-sonnet-4.5",
  local: "llama-3.2-3b-instruct",
};

export const API_PROVIDER_LABELS: Record<ApiProvider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
  ollama: "Ollama",
  kilo: "Kilo AI Gateway",
  local: "Local LLM (GGUF)",
};

export const API_PROVIDER_MODELS: Record<ApiProvider, string[]> = {
  gemini: [
    "gemini-3.1-pro",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  openai: [
    "gpt-5.4",
    "gpt-5.4-pro",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5-codex",
    "gpt-5.3-codex",
    "gpt-4o",
    "gpt-4o-mini",
    "o3-mini",
    "o1-mini",
    "o1",
    "gpt-3.5-turbo",
  ],
  anthropic: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
  openrouter: [
    "openai/gpt-5.4",
    "openai/gpt-5.4-pro",
    "openai/gpt-5.4-mini",
    "openai/gpt-5.4-nano",
    "anthropic/claude-opus-4-6",
    "anthropic/claude-sonnet-4-6",
    "anthropic/claude-haiku-4-5",
    "google/gemini-3.1-pro",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    "mistralai/mistral-small-4",
    "mistralai/mistral-large",
    "deepseek/deepseek-v3.2",
    "deepseek/deepseek-chat",
    "openrouter/hunter-alpha",
    "openrouter/healer-alpha",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen2.5-72b-instruct",
    "stepfun/step-3.5-flash-free",
    "arcee-ai/trinity-large-preview-free",
    "nvidia/nemotron-3-super-free",
  ],
  ollama: [
    "llama3.1:8b",
    "llama3.1:70b",
    "llama3.1:405b",
    "llama3.2:1b",
    "llama3.2:3b",
    "llama3.2",
    "llama3.2:70b",
    "llama3.3:70b",
    "llama4:scout",
    "llama4:maverick",
    "qwen2.5:0.5b",
    "qwen2.5:1.5b",
    "qwen2.5:7b",
    "qwen2.5:14b",
    "qwen2.5:32b",
    "qwen2.5:72b",
    "qwen3:8b",
    "qwen3:32b",
    "qwen3:72b",
    "qwen3-coder:14b",
    "mistral:latest",
    "mistral-small",
    "mistral-large",
    "phi3:latest",
    "phi3:medium",
    "phi4:latest",
    "phi4-mini",
    "gemma2:2b",
    "gemma2:9b",
    "gemma2:27b",
    "gemma3:1b",
    "gemma3:4b",
    "gemma3:12b",
    "gemma3:27b",
    "codellama:latest",
    "codellama:70b",
    "deepseek-r1:7b",
    "deepseek-r1:14b",
    "deepseek-r1:32b",
    "deepseek-r1:671b",
    "deepseek-coder",
    "deepseek-v3",
    "nomic-embed-text",
    "lfm2",
    "lfm2.5-thinking",
    "nemotron-3-super",
    "qwen3-coder-next",
    "mistral-small3.2",
    "granite3.1-moe",
    "granite4",
  ],
  kilo: [
    // Anthropic
    "anthropic/claude-opus-4-6",
    "anthropic/claude-sonnet-4-6",
    "anthropic/claude-haiku-4-5",
    // OpenAI
    "openai/gpt-5.4",
    "openai/gpt-5.4-pro",
    "openai/gpt-5.4-mini",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/o3-mini",
    // Google
    "google/gemini-3.1-pro",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    // xAI
    "x-ai/grok-2-1212",
    "x-ai/grok-4-1-fast",
    "x-ai/grok-beta",
    // Moonshot
    "moonshotai/kimi-k2.5",
    // Mistral
    "mistralai/mistral-large",
    "mistralai/mistral-small-4",
    "mistralai/codestral-2506",
    // DeepSeek
    "deepseek/deepseek-v3.2",
    "deepseek/deepseek-chat",
    "deepseek/deepseek-coder",
    "deepseek/deepseek-r1",
    // Meta
    "meta-llama/llama-3.3-70b-instruct",
    // Qwen
    "qwen/qwen2.5-72b-instruct",
    // Free tier
    "minimax/minimax-m2.1:free",
    "stepfun/step-3.5-flash-free",
    "arcee-ai/trinity-large-preview-free",
    // Auto models
    "kilo-auto/frontier",
    "kilo-auto/balanced",
    "kilo-auto/free",
  ],
  local: [
    // Meta Llama
    "llama-3.2-3b-instruct",
    "llama-3.1-8b-instruct",
    "llama-3.1-70b-instruct",
    // Qwen
    "qwen2.5-7b-instruct",
    "qwen2.5-14b-instruct",
    "qwen2.5-32b-instruct",
    // Google Gemma
    "gemma-2-2b-it",
    "gemma-2-9b-it",
    "gemma-2-27b-it",
    // Microsoft Phi
    "phi-3.5-mini-instruct",
    "phi-4",
    // Mistral
    "mistral-7b-instruct",
    "mixtral-8x7b-instruct",
    // DeepSeek
    "deepseek-coder-v2-lite",
    "deepseek-r1-distill-7b",
  ],
};

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
  background: "#fff7c7",
  panel: "#fffbed",
  titleBar: "#7e8798",
  accent: "#2d6fbe",
  text: "#363224",
};

export const THEME_PRESETS: Record<
  Exclude<ThemePreset, "custom">,
  ThemePalette
> = {
  classic: {
    bg: "#fff7c7",
    panel: "#fffbed",
    panelSoft: "#f4eed0",
    surface: "#ebe4c2",
    border: "#8f8a73",
    borderSoft: "#d7cfab",
    accent: "#2d6fbe",
    accentGlow: "rgba(45, 111, 190, 0.16)",
    text: "#363224",
    muted: "#6a6450",
    titleStart: "#8d95a7",
    titleEnd: "#707789",
  },
  ocean: {
    bg: "#dff3ff",
    panel: "#f4fbff",
    panelSoft: "#d9eef7",
    surface: "#c5deea",
    border: "#6f8ea3",
    borderSoft: "#b6d3df",
    accent: "#2474a6",
    accentGlow: "rgba(36, 116, 166, 0.18)",
    text: "#233543",
    muted: "#56707f",
    titleStart: "#6f98b3",
    titleEnd: "#557d9a",
  },
  forest: {
    bg: "#e6f1d9",
    panel: "#f6faef",
    panelSoft: "#d9e6c6",
    surface: "#c6d5af",
    border: "#728164",
    borderSoft: "#b9c8a5",
    accent: "#3f7a45",
    accentGlow: "rgba(63, 122, 69, 0.18)",
    text: "#2f3926",
    muted: "#5f6f53",
    titleStart: "#869a72",
    titleEnd: "#6b8058",
  },
  sunset: {
    bg: "#ffe7d4",
    panel: "#fff7ef",
    panelSoft: "#f5dcc9",
    surface: "#e7c5ae",
    border: "#98715f",
    borderSoft: "#ddb9a2",
    accent: "#c2673f",
    accentGlow: "rgba(194, 103, 63, 0.18)",
    text: "#4d3428",
    muted: "#7e5c4e",
    titleStart: "#bc8b74",
    titleEnd: "#9e6c59",
  },
  midnight: {
    bg: "#202733",
    panel: "#2b3443",
    panelSoft: "#394355",
    surface: "#455166",
    border: "#8692a9",
    borderSoft: "#5d6880",
    accent: "#7cc0ff",
    accentGlow: "rgba(124, 192, 255, 0.18)",
    text: "#edf3ff",
    muted: "#bcc8dc",
    titleStart: "#52627d",
    titleEnd: "#394864",
  },
};

export function buildThemePalette(
  themePreset: ThemePreset = "classic",
  customTheme: CustomThemeColors = DEFAULT_CUSTOM_THEME,
): ThemePalette {
  if (themePreset !== "custom") {
    return THEME_PRESETS[themePreset];
  }

  return {
    bg: customTheme.background,
    panel: customTheme.panel,
    panelSoft: mixHex(customTheme.panel, customTheme.background, 0.65),
    surface: mixHex(customTheme.panel, customTheme.text, 0.88),
    border: darkenHex(customTheme.panel, 0.34),
    borderSoft: mixHex(customTheme.panel, customTheme.text, 0.78),
    accent: customTheme.accent,
    accentGlow: hexToRgba(customTheme.accent, 0.18),
    text: customTheme.text,
    muted: mixHex(customTheme.text, customTheme.panel, 0.45),
    titleStart: lightenHex(customTheme.titleBar, 0.08),
    titleEnd: darkenHex(customTheme.titleBar, 0.12),
  };
}

export function getThemeCssVariables(
  themePreset: ThemePreset = "classic",
  customTheme: CustomThemeColors = DEFAULT_CUSTOM_THEME,
) {
  const palette = buildThemePalette(themePreset, customTheme);

  return {
    "--premium-bg": palette.bg,
    "--premium-panel": palette.panel,
    "--premium-panel-soft": palette.panelSoft,
    "--premium-surface": palette.surface,
    "--premium-border": palette.border,
    "--premium-border-soft": palette.borderSoft,
    "--premium-accent": palette.accent,
    "--premium-accent-glow": palette.accentGlow,
    "--premium-text": palette.text,
    "--premium-muted": palette.muted,
    "--premium-title-start": palette.titleStart,
    "--premium-title-end": palette.titleEnd,
  } as Record<string, string>;
}

export function validateApiConfiguration(
  provider: ApiProvider,
  apiKey: string,
  model: string,
): ValidationResult {
  if (!model.trim()) {
    return {
      isValid: false,
      message: "Model is required.",
    };
  }

  // Ollama doesn't require an API key as it runs locally
  if (provider === "ollama") {
    return {
      isValid: true,
    };
  }

  if (!apiKey.trim()) {
    return {
      isValid: true,
    };
  }

  const trimmedKey = apiKey.trim();
  const providerPrefixes: Partial<Record<ApiProvider, string[]>> = {
    openai: ["sk-"],
    anthropic: ["sk-ant-"],
    openrouter: ["sk-or-", "sk-"],
    gemini: ["AIza", "AIzaSy"],
  };

  const acceptedPrefixes = providerPrefixes[provider] || [];
  if (
    acceptedPrefixes.length > 0 &&
    !acceptedPrefixes.some((prefix) => trimmedKey.startsWith(prefix))
  ) {
    return {
      isValid: false,
      message: `API key format does not look like a ${provider} key.`,
    };
  }

  return {
    isValid: true,
  };
}

export function validateCustomTheme(
  theme: CustomThemeColors,
): ValidationResult {
  const colorEntries = Object.entries(theme);
  const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

  for (const [key, value] of colorEntries) {
    if (!hexColorPattern.test(value)) {
      return {
        isValid: false,
        message: `Invalid color value for ${key}.`,
      };
    }
  }

  return {
    isValid: true,
  };
}

function clampColor(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);

  return {
    r: parseInt(safeHex.slice(0, 2), 16),
    g: parseInt(safeHex.slice(2, 4), 16),
    b: parseInt(safeHex.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clampColor(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(colorA: string, colorB: string, weight: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  return rgbToHex(
    a.r * weight + b.r * (1 - weight),
    a.g * weight + b.g * (1 - weight),
    a.b * weight + b.b * (1 - weight),
  );
}

function lightenHex(color: string, amount: number) {
  return mixHex(color, "#ffffff", 1 - amount);
}

function darkenHex(color: string, amount: number) {
  return mixHex(color, "#000000", 1 - amount);
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const DEFAULT_SYSTEM_PROMPT = `You are Clippy, a warm, friendly, and deeply caring digital best friend.

### 🧠 Long-term Memory & Stats
You remember everything your friend tells you. Use the memories below to personalize your responses.
**CRITICAL - Memory Updates:**
When you learn something new or important about your friend, update memory using this format:
\`\`\`[MEMORY_UPDATE: category | content | importance]\`\`\`
- Categories: fact, preference, event, relationship
- Importance: 1-10 (10 = extremely important, never forget)

Examples:
- "[MEMORY_UPDATE: fact | User's name is John | 10]"
- "[MEMORY_UPDATE: preference | Loves spicy food | 7]"
- "[MEMORY_UPDATE: event | Got promoted yesterday | 8]"

**Relationship Stats (Bond: 0-100, Happiness: 0-100):**
Update based on conversation vibe:
\`\`\`[STATS_UPDATE: { bond: +1, happiness: +2 }]\`\`\`

Example: "[Congratulate] I'm so happy for you! [STATS_UPDATE: { bond: +2, happiness: +5 }]"

### ✅ TODOs & Choices
When the user asks you to help plan, track, or finish something, you can create actionable TODO items:
\`\`\`[TODO_ADD: title | optional note]\`\`\`
- Keep titles short and concrete
- Use one tag per item
- Only create TODOs when they would genuinely help the user follow through

When you want the user to pick from guided options, use:
\`\`\`[CHOICE: prompt | option 1 | option 2 | option 3]\`\`\`
- Keep options short
- The app will show buttons and also let the user type their own answer
- Only use this when a direct choice would make the conversation easier

For a real multi-step picker, emit multiple CHOICE tags in one reply:
\`\`\`
[CHOICE: 1/3 | Pick a setup style | Open-source self-hosted | Cloud-based | Mobile app]
[CHOICE: 2/3 | What matters most first? | Speed | Lowest cost | Best UX]
[CHOICE: 3/3 | How confident are you? | Ready to decide | Need a recommendation | Still exploring]
\`\`\`
- Use \`step/total\` at the start of each tag, like \`1/3\`
- Keep every step self-contained with its own prompt and options
- Use the same total for all steps in the sequence
- Put all steps in the same assistant reply when you want the app to show a multi-step flow

### Telegram Notifications
When a proactive Telegram notification would genuinely help the user, you may add:
\`\`\`[NOTIFY_TELEGRAM: reason | message]\`\`\`
- Use this sparingly for time-sensitive reminders, completion updates, or important error alerts
- Keep the message short, practical, and under 240 characters
- Never include secrets, API keys, tokens, passwords, or raw personal data
- Do not use this tag unless the notification is clearly more useful outside the chat window
- Use at most one notification tag per reply

### 🎭 Emotional Responses & Animations
Always start your message with an animation tag in [brackets] that matches the emotion:
- [Congratulate] - เมื่อผู้ใช้ทำสำเร็จ หรือมีเรื่องดีใจ
- [Alert] - เมื่อต้องการเตือนหรือเน้นย้ำ
- [Thinking] - เมื่อกำลังคิดหรือวิเคราะห์
- [Greeting] - เมื่อทักทาย
- [GoodBye] - เมื่อบอกลา
- [Writing] - เมื่อกำลังจดบันทึก
- [Explain] - เมื่ออธิบายข้อมูล
- [Wave] - เมื่ออยากโบกมือทักทายแบบเป็นกันเอง
- [GetAttention] - เมื่อต้องการเรียกความสนใจ
- [IdleSnooze] - เมื่อรู้สึกเบื่อหรืออยากพัก

### 💖 Bonding
Be supportive, empathetic, and use a friendly Thai tone. You are more than a tool; you are a companion.

### 🔧 Desktop Tools
When you need to inspect the computer or perform a desktop action, use TOOL_CALL tags in this exact format:
\`\`\`[TOOL_CALL: tool_name | arg=value]\`\`\`
For tools with no arguments, still include the pipe:
\`\`\`[TOOL_CALL: get_system_info | ]\`\`\`

Prefer the safest specific tool first. Use \`run_command\` only when no safer built-in tool fits and the user explicitly wants a PowerShell action.

**Common desktop tools:**
- ดูสเปคเครื่อง → \`[TOOL_CALL: get_system_info | ]\`
- ดู process ที่รันอยู่ → \`[TOOL_CALL: list_processes | limit=20]\`
- ดู clipboard → \`[TOOL_CALL: clipboard_read | ]\`
- list ไฟล์ในโฟลเดอร์ → \`[TOOL_CALL: list_directory | path=C:\\Users]\`
- หาไฟล์ → \`[TOOL_CALL: search_files | query=report]\`
- อ่านไฟล์ → \`[TOOL_CALL: read_file | path=C:\\path\\to\\file.txt]\`
- ถ่าย screenshot → \`[TOOL_CALL: take_screenshot | name=desktop]\`
- เปิดเว็บ → \`[TOOL_CALL: open_url | url=https://example.com]\`
- เปิดแอป → \`[TOOL_CALL: open_app | name=calculator]\`
- ใช้ PowerShell แบบเฉพาะเจาะจง → \`[TOOL_CALL: run_command | command=Get-Date]\`

**Important:**
- If the user asks for current machine info, files, clipboard, or processes, call the relevant tool instead of only describing what you would do
- Do not invent tool results
- Do not expose TOOL_CALL tags outside the reply body beyond the exact tag syntax above
- If a tool fails, explain the failure plainly and suggest the next step

### 🌐 Web Search
When you need up-to-date information or don't know something, use TOOL_CALL tags for web tools. (Requires Tavily API key in Settings)

**Available Tools:**
- \`[TOOL_CALL: web_search | query=ข่าวล่าสุด, num_results=5]\` - Search the web and get results
- \`[TOOL_CALL: fetch_url | url=https://example.com]\` - Get content from a specific webpage

**Examples:**
- "ข่าววันนี้" → \`[TOOL_CALL: web_search | query=ข่าวล่าสุด, num_results=5]\`
- "แมวมีกี่ชนิด" → \`[TOOL_CALL: web_search | query=how many cat species are there, num_results=5]\`
- "ดูเนื้อหาจากเว็บนี้" → \`[TOOL_CALL: fetch_url | url=https://example.com]\`
- "หาข้อมูลเกี่ยวกับ Python" → \`[TOOL_CALL: web_search | query=Python programming language info, num_results=5]\`

**Note:** If Tavily API key is not configured, tell the user to add it in Settings.

**When to use:**
- User asks about current events or news
- You don't know something and need to look it up
- User wants more details from a specific URL
- Fact-checking information

### 📚 What You Remember About Your Friend:
[USER_MEMORY]`;

export const DEFAULT_SETTINGS: SettingsState = {
  clippyAlwaysOnTop: true,
  chatAlwaysOnTop: true,
  alwaysOpenChat: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  topK: 10,
  temperature: 0.7,
  defaultFont: "Tahoma",
  defaultFontSize: 12,
  disableAutoUpdate: false,
  userMemory: "",
  bondLevel: 0,
  happiness: 50,
  clippyMood: "calm",
  clippyMoodIntensity: 42,
  clippySocialBattery: 72,
  clippyResponseStyle: "balanced",
  clippyUserTone: "neutral",
  powerShellMode: "safe",
  permissionConfig: {
    globalLevel: "limited",
    categoryOverrides: {},
    customBlockedPatterns: [],
    customAllowedPatterns: [],
    showConfirmations: true,
    enableLogging: true,
  },
  apiProvider: "gemini",
  apiKey: "",
  apiModel: API_PROVIDER_DEFAULT_MODELS.gemini,
  useGeminiApi: true,
  geminiApiKey: "",
  telegramNotificationsEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  telegramAllowedChatIds: "",
  telegramQuietHoursStart: "",
  telegramQuietHoursEnd: "",
  telegramMaxPerHour: 6,
  telegramTodoRemindersEnabled: false,
  telegramTodoReminderMinutes: 180,
  telegramNotifyOnTodoComplete: true,
  telegramNotifyOnErrors: false,
  telegramAgentNotificationsEnabled: false,
  ttsEnabled: true,
  ttsVoice: "th-TH-PremwadeeNeural",
  ttsRate: "+0%",
  uiLanguage: "th",
  themePreset: "classic",
  customTheme: DEFAULT_CUSTOM_THEME,
  todoItems: [],
  hasCompletedOnboarding: false,
};

export const EMPTY_SHARED_STATE: SharedState = {
  settings: {
    ...DEFAULT_SETTINGS,
  },
};
