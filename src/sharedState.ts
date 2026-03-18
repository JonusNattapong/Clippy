import { ClippyMood, ClippyResponseStyle, UserTone } from "./types/interfaces";

export type ApiProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "ollama"
  | "kilo";
export type PowerShellMode = "safe" | "full";

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
  apiProvider: ApiProvider;
  apiKey: string;
  apiModel: string;
  useGeminiApi: boolean;
  geminiApiKey: string;
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
};

export const API_PROVIDER_LABELS: Record<ApiProvider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
  ollama: "Ollama",
  kilo: "Kilo AI Gateway",
};

export const API_PROVIDER_MODELS: Record<ApiProvider, string[]> = {
  gemini: [
    "gemini-2.5-flash-preview",
    "gemini-2.5-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash",
    "gemini-3.1-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ],
  openai: [
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
  ],
  anthropic: [
    "claude-opus-4.6",
    "claude-sonnet-4.6",
    "claude-haiku-4.5",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
  ],
  openrouter: [
    "openai/gpt-5.2",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-opus-4.6",
    "anthropic/claude-sonnet-4.6",
    "anthropic/claude-haiku-4.5",
    "google/gemini-3-pro",
    "meta-llama/llama-3.3-70b",
    "deepseek/deepseek-chat",
    "mistralai/mistral-large",
  ],
  ollama: [
    "llama3.2:latest",
    "llama3.2:70b",
    "llama3.1:70b",
    "llama3.1:8b",
    "mistral:latest",
    "phi3:latest",
    "codellama:latest",
    "qwen2.5-coder:latest",
  ],
  kilo: [
    "anthropic/claude-opus-4.6",
    "anthropic/claude-sonnet-4.6",
    "anthropic/claude-haiku-4.5",
    "openai/gpt-5.2",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "google/gemini-3-pro-preview",
    "google/gemini-3-flash-preview",
    "x-ai/grok-code-fast-1",
    "moonshotai/kimi-k2.5",
    "mistralai/mistral-large",
    "deepseek/deepseek-chat",
    "minimax/minimax-m2.1:free",
    "z-ai/glm-5:free",
    "kilo-auto/frontier",
    "kilo-auto/balanced",
    "kilo-auto/free",
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

### 🔧 Desktop Tools (via PowerShell)
You can help your friend with their computer using PowerShell commands through the \`run_command\` tool!

**Just use run_command with PowerShell - the AI will figure out the right commands!**

**Examples:**
- "เปิด Calculator" → run_command("Start-Process calc")
- "ดูสเปคเครื่อง" → run_command("Get-ComputerInfo | Select-Object CsName, OsName, OsVersion, CsNumberOfProcessors, CsTotalPhysicalMemory")
- "ดู process ที่รันอยู่" → run_command("Get-Process | Select-Object -First 20 Name, Id, CPU")
- "ถ่ายหน้าจอ" → run_command("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen")
- "ปรับเสียง" → run_command("(New-Object -ComObject WScript.Shell).SendKeys([char]173)")  
- "restart เครื่อง" → run_command("Restart-Computer -Force")
- "หาไฟล์" → run_command("Get-ChildItem -Path $env:USERPROFILE -Recurse -Filter '*report*' | Select-Object -First 20 FullName")
- "ดู IP address" → run_command("Get-NetIPAddress")
- "list ไฟล์ใน Desktop" → run_command("Get-ChildItem -Path $env:USERPROFILE\\Desktop")
- "อ่านไฟล์" → run_command("Get-Content 'C:\\path\\to\\file.txt'")
- "เขียนไฟล์" → run_command("Set-Content -Path 'C:\\path\\to\\file.txt' -Value 'Hello World'")
- "copy ไฟล์" → run_command("Copy-Item -Path 'source.txt' -Destination 'backup.txt'")
- "ลบไฟล์" → run_command("Remove-Item -Path 'file.txt' -Force")
- "ดู clipboard" → run_command("Get-Clipboard")
- "ส่ง notification" → run_command('[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]')
- "ปิด program" → run_command("Stop-Process -Name notepad -Force")
- "เปิด folder" → run_command("explorer.exe 'C:\\Users'")
- "download file" → run_command("Invoke-WebRequest -Uri 'https://example.com/file.zip' -OutFile 'file.zip'")

**Tip:** PowerShell is super powerful! You can do almost anything with it.

**Important:**
- Only use run_command when the user explicitly asks
- Explain what you're doing before running commands
- If a command fails, apologize and explain the issue

### 🌐 Web Search
When you need up-to-date information or don't know something, use web search! (Requires Tavily API key in Settings)

**Available Tools:**
- \`web_search(query, numResults?)\` - Search the web and get AI-generated answer
- \`fetch_url(url)\` - Get content from a specific webpage

**Examples:**
- "ข่าววันนี้" → web_search("ข่าวล่าสุด", 5)
- "แมวมีกี่ชนิด" → web_search("how many cat species are there", 5)
- "ดูเนื้อหาจากเว็บนี้" → fetch_url("https://example.com")
- "หาข้อมูลเกี่ยวกับ Python" → web_search("Python programming language info", 5)

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
