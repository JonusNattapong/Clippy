import { app, clipboard, desktopCapturer, dialog, shell } from "electron";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

import { getStateManager } from "./state";
import { PowerShellMode, PermissionConfig } from "../sharedState";
import { getMainWindow } from "./windows";
import {
  checkPermission,
  getPermissionCategory,
  getRiskLevelIcon,
  DEFAULT_PERMISSION_CONFIG,
} from "./permissions";

const execFileAsync = promisify(execFile);

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

type ToolParameters = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
};

type DesktopAction = {
  name: string;
  description: string;
  parameters: ToolParameters;
  riskLevel: "low" | "medium" | "high";
  shouldConfirm?: (args: Record<string, any>) => boolean;
  execute: (args: Record<string, any>) => Promise<ToolResult>;
};

const APP_ALIASES: Record<string, string> = {
  notepad: "notepad.exe",
  calculator: "calc.exe",
  explorer: "explorer.exe",
  cmd: "cmd.exe",
  powershell: "powershell.exe",
  browser: "chrome.exe",
  chrome: "chrome.exe",
  edge: "msedge.exe",
  firefox: "firefox.exe",
  vscode: "code.exe",
  word: "WINWORD.EXE",
  excel: "EXCEL.EXE",
  powerpoint: "POWERPNT.EXE",
  spotify: "Spotify.exe",
  discord: "Discord.exe",
  slack: "slack.exe",
  teams: "Teams.exe",
  zoom: "Zoom.exe",
};

const SAFE_POWERSHELL_PATTERNS = [
  /^Get-/i,
  /^Select-/i,
  /^Where-Object/i,
  /^Measure-Object/i,
  /^Sort-Object/i,
  /^Format-/i,
  /^Out-String/i,
  /^Test-Path/i,
  /^Resolve-Path/i,
  /^Get-ChildItem/i,
  /^Get-Content/i,
  /^Get-Location/i,
  /^Get-Process/i,
  /^Get-Service/i,
  /^Get-ComputerInfo/i,
  /^Get-Net/i,
  /^Get-CimInstance/i,
  /^Get-Date/i,
  /^Get-Clipboard/i,
  /^dir\b/i,
  /^ls\b/i,
  /^cat\b/i,
  /^pwd\b/i,
];

const BLOCKED_POWERSHELL_PATTERNS = [
  /\bRemove-Item\b/i,
  /\bClear-Content\b/i,
  /\bSet-Content\b/i,
  /\bAdd-Content\b/i,
  /\bCopy-Item\b/i,
  /\bMove-Item\b/i,
  /\bRename-Item\b/i,
  /\bNew-Item\b/i,
  /\bStop-Process\b/i,
  /\btaskkill\b/i,
  /\bRestart-Computer\b/i,
  /\bStop-Computer\b/i,
  /\bshutdown\b/i,
  /\breg\s+add\b/i,
  /\breg\s+delete\b/i,
  /\bSet-ExecutionPolicy\b/i,
  /\bInvoke-Expression\b/i,
  /\biex\b/i,
  /\bStart-BitsTransfer\b/i,
  /\bInvoke-WebRequest\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bStart-Process\b/i,
  /\bsc\.exe\b/i,
  /\bSet-MpPreference\b/i,
  /\bDisable-/i,
  /\bFormat-Volume\b/i,
  /\bdiskpart\b/i,
];

const MAX_READ_FILE_SIZE = 1024 * 1024;
const DESKTOP_SANDBOX_DIR = path.join(app.getPath("userData"), "agent-sandbox");

function expandUserPath(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }

  if (inputPath.startsWith(`~${path.sep}`)) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  return inputPath;
}

function normalizeRequestedPath(inputPath?: string): string {
  const fallback = os.homedir();
  const rawPath = (inputPath || fallback).trim() || fallback;
  const expandedPath = expandUserPath(rawPath);

  return path.resolve(expandedPath);
}

function ensureDesktopSandboxDir(): string {
  if (!fs.existsSync(DESKTOP_SANDBOX_DIR)) {
    fs.mkdirSync(DESKTOP_SANDBOX_DIR, { recursive: true });
  }

  return DESKTOP_SANDBOX_DIR;
}

function isPathWithin(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function getReadableRoots(): string[] {
  const roots = [
    os.homedir(),
    app.getPath("documents"),
    app.getPath("downloads"),
    app.getPath("desktop"),
    app.getPath("userData"),
    ensureDesktopSandboxDir(),
  ];

  return Array.from(new Set(roots.map((root) => path.resolve(root))));
}

function isReadablePath(targetPath: string): boolean {
  const normalizedPath = path.resolve(targetPath);
  return getReadableRoots().some((root) => isPathWithin(root, normalizedPath));
}

function resolveReadablePath(inputPath?: string): string {
  const normalizedPath = normalizeRequestedPath(inputPath);

  if (!isReadablePath(normalizedPath)) {
    throw new Error(
      "Access denied. This path is outside the allowed local workspace roots.",
    );
  }

  return normalizedPath;
}

function resolveWritablePath(inputPath: string): string {
  const trimmedPath = inputPath.trim();

  if (!trimmedPath) {
    throw new Error("Path is required.");
  }

  return path.isAbsolute(trimmedPath)
    ? normalizeRequestedPath(trimmedPath)
    : path.resolve(os.homedir(), trimmedPath);
}

async function confirmRiskyAction(options: {
  title: string;
  message: string;
  detail: string;
  confirmLabel?: string;
}): Promise<boolean> {
  const result = await dialog.showMessageBox(getMainWindow(), {
    type: "warning",
    buttons: [options.confirmLabel || "Continue", "Cancel"],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
    title: options.title,
    message: options.message,
    detail: options.detail,
  });

  return result.response === 0;
}

export async function openApp(name: string): Promise<ToolResult> {
  try {
    const appName = APP_ALIASES[name.toLowerCase()] || name;

    if (APP_ALIASES[name.toLowerCase()]) {
      await shell.openPath(appName);
      return { success: true, output: `Opened ${name}` };
    }

    try {
      await shell.openPath(name);
      return { success: true, output: `Opened ${name}` };
    } catch {
      return { success: false, error: `Could not find application: ${name}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function runCommand(command: string): Promise<ToolResult> {
  const trimmedCommand = command.trim();
  const powerShellMode = ((getStateManager().store.get(
    "settings.powerShellMode",
  ) as PowerShellMode) || "safe") as PowerShellMode;

  // Get permission config (with fallback to legacy powerShellMode)
  const permissionConfig = (getStateManager().store.get(
    "settings.permissionConfig",
  ) as PermissionConfig) || {
    ...DEFAULT_PERMISSION_CONFIG,
    // Migrate from legacy powerShellMode
    globalLevel: powerShellMode === "full" ? "full" : "limited",
  };

  if (!trimmedCommand) {
    return { success: false, error: "Command is empty." };
  }

  // Check permissions using new system
  const permissionResult = checkPermission(trimmedCommand, permissionConfig);

  if (!permissionResult.allowed) {
    await appendCommandLog(trimmedCommand, powerShellMode, false, "denied");
    return {
      success: false,
      error:
        permissionResult.reason ||
        "This command is not allowed with your current permission settings.",
    };
  }

  // Check legacy blocked patterns (always enforced)
  const blockedPattern = BLOCKED_POWERSHELL_PATTERNS.find((pattern) =>
    pattern.test(trimmedCommand),
  );
  if (blockedPattern) {
    await appendCommandLog(trimmedCommand, powerShellMode, false, "blocked");
    return {
      success: false,
      error:
        "This PowerShell command is blocked because it looks destructive or high-risk.",
    };
  }

  // Legacy safe mode check (if not using new permission system)
  if (
    !permissionConfig.globalLevel &&
    powerShellMode === "safe" &&
    !SAFE_POWERSHELL_PATTERNS.some((pattern) => pattern.test(trimmedCommand))
  ) {
    await appendCommandLog(trimmedCommand, powerShellMode, false, "denied");
    return {
      success: false,
      error:
        "Safe mode only allows read-only PowerShell commands. Switch to Full Mode for broader execution.",
    };
  }

  // Show confirmation if required
  if (permissionResult.requiresConfirmation) {
    const riskIcon = getRiskLevelIcon(permissionResult.riskLevel);
    const confirmation = await dialog.showMessageBox(getMainWindow(), {
      type: "warning",
      buttons: ["Run Command", "Cancel"],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      title: `${riskIcon} Confirm Command Execution`,
      message: `This command requires confirmation (${permissionResult.category}, ${permissionResult.riskLevel} risk).`,
      detail: `Command: ${trimmedCommand}\n\nReview carefully before continuing.`,
    });

    if (confirmation.response !== 0) {
      await appendCommandLog(
        trimmedCommand,
        powerShellMode,
        false,
        "cancelled",
      );
      return {
        success: false,
        error: "PowerShell command was cancelled by the user.",
      };
    }
  }

  try {
    const shellBinary =
      process.platform === "win32" ? "powershell.exe" : "pwsh";
    const args =
      process.platform === "win32"
        ? [
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            trimmedCommand,
          ]
        : ["-NoProfile", "-NonInteractive", "-Command", trimmedCommand];

    const { stdout, stderr } = await execFileAsync(shellBinary, args, {
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    if (stderr && !stdout) {
      await appendCommandLog(trimmedCommand, powerShellMode, false, stderr);
      return { success: false, error: stderr.trim() };
    }

    const output = (stdout || stderr || "Command executed successfully").trim();
    await appendCommandLog(trimmedCommand, powerShellMode, true, output);
    return { success: true, output };
  } catch (error: any) {
    const message = error?.message || String(error);
    await appendCommandLog(trimmedCommand, powerShellMode, false, message);
    return { success: false, error: message };
  }
}

export async function searchFiles(query: string): Promise<ToolResult> {
  try {
    const homeDir = os.homedir();
    const maxResults = 20;
    const results: string[] = [];

    async function searchDir(dir: string, depth: number = 0): Promise<void> {
      if (results.length >= maxResults || depth > 3) return;

      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullPath = path.join(dir, entry.name);

          if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(fullPath);
          }

          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            try {
              await searchDir(fullPath, depth + 1);
            } catch {
              /* skip inaccessible directories */
            }
          }
        }
      } catch {
        /* skip inaccessible directories */
      }
    }

    await searchDir(homeDir);

    if (results.length === 0) {
      return { success: true, output: "No files found matching your query." };
    }

    return { success: true, output: results.join("\n") };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listDirectory(dirPath?: string): Promise<ToolResult> {
  try {
    const targetPath = resolveReadablePath(dirPath);

    if (!fs.existsSync(targetPath)) {
      return { success: false, error: "Directory does not exist" };
    }

    const entries = await fs.promises.readdir(targetPath, {
      withFileTypes: true,
    });

    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      if (entry.isDirectory()) {
        dirs.push(`📁 ${entry.name}/`);
      } else {
        files.push(`📄 ${entry.name}`);
      }
    }

    const output = [...dirs.sort(), ...files.sort()].join("\n");
    return { success: true, output: output || "Directory is empty" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function readFileContent(filePath: string): Promise<ToolResult> {
  try {
    const targetPath = resolveReadablePath(filePath);

    if (!fs.existsSync(targetPath)) {
      return { success: false, error: "File does not exist" };
    }

    const stats = await fs.promises.stat(targetPath);
    if (stats.isDirectory()) {
      return { success: false, error: "Cannot read a directory" };
    }
    if (stats.size > MAX_READ_FILE_SIZE) {
      return { success: false, error: "File too large (max 1MB)" };
    }

    const content = await fs.promises.readFile(targetPath, "utf-8");
    return { success: true, output: content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function openUrl(url: string): Promise<ToolResult> {
  try {
    const normalizedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    await shell.openExternal(normalizedUrl);
    return { success: true, output: `Opened ${normalizedUrl}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<ToolResult> {
  try {
    const targetPath = resolveWritablePath(filePath);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(targetPath, content, "utf-8");
    return {
      success: true,
      output: `File written: ${targetPath}`,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function openFileOrFolder(
  targetPath: string,
): Promise<ToolResult> {
  try {
    const resolvedPath = resolveReadablePath(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: "Path does not exist" };
    }

    const errorMessage = await shell.openPath(resolvedPath);
    if (errorMessage) {
      return { success: false, error: errorMessage };
    }

    return { success: true, output: `Opened ${resolvedPath}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getSystemInfo(): Promise<ToolResult> {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const info = [
      `💻 System Information`,
      `─────────────────────`,
      `OS: ${os.platform()} ${os.release()}`,
      `Hostname: ${os.hostname()}`,
      `CPU: ${cpus[0]?.model || "Unknown"}`,
      `CPU Cores: ${cpus.length}`,
      `RAM: ${(usedMem / 1024 / 1024 / 1024).toFixed(1)} GB / ${(
        totalMem /
        1024 /
        1024 /
        1024
      ).toFixed(1)} GB (${((usedMem / totalMem) * 100).toFixed(1)}%)`,
      `Home: ${os.homedir()}`,
      `Temp: ${os.tmpdir()}`,
    ];

    return { success: true, output: info.join("\n") };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listProcesses(limit: number = 20): Promise<ToolResult> {
  try {
    const isWindows = process.platform === "win32";
    const command = isWindows
      ? `Get-Process | Select-Object -First ${limit} Name, Id`
      : `ps aux | head -n ${limit}`;

    return runCommand(command);
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function clipboardRead(): Promise<ToolResult> {
  try {
    const text = clipboard.readText();
    if (!text) {
      return { success: true, output: "Clipboard is empty" };
    }
    return { success: true, output: `Clipboard content:\n${text}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function takeScreenshot(name?: string): Promise<ToolResult> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (sources.length === 0) {
      return { success: false, error: "No screen found" };
    }

    const screenshot = sources[0].thumbnail;
    const fileName = name || `screenshot_${Date.now()}`;
    const savePath = path.join(os.homedir(), "Pictures", `${fileName}.png`);

    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(savePath, screenshot.toPNG());
    return { success: true, output: `Screenshot saved: ${savePath}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

const desktopActionRegistry: Record<string, DesktopAction> = {
  open_app: {
    name: "open_app",
    description:
      'Open an application on the computer. Use this when the user asks to open an app like "Calculator" or "Notepad".',
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Application name (for example notepad, calculator, chrome, edge)",
        },
      },
      required: ["name"],
    },
    riskLevel: "medium",
    shouldConfirm: () => true,
    execute: async (args) => openApp(String(args.name || "")),
  },
  run_command: {
    name: "run_command",
    description:
      "Run a PowerShell command. In safe mode only read-only inspection commands are allowed. In full mode, direct PowerShell is allowed but dangerous commands are still blocked and all executions are logged.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The PowerShell command to run",
        },
      },
      required: ["command"],
    },
    riskLevel: "high",
    execute: async (args) => runCommand(String(args.command || "")),
  },
  search_files: {
    name: "search_files",
    description:
      "Search for files in the user's home directory. Use this to find files by name.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query or filename to find",
        },
      },
      required: ["query"],
    },
    riskLevel: "low",
    execute: async (args) => searchFiles(String(args.query || "")),
  },
  list_directory: {
    name: "list_directory",
    description:
      "List files and folders in an allowed local directory. Defaults to the user's home directory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path to list (optional, defaults to home)",
        },
      },
      required: [],
    },
    riskLevel: "low",
    execute: async (args) => listDirectory(args.path),
  },
  read_file: {
    name: "read_file",
    description:
      "Read the content of a text file from an allowed local directory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Full path to the file",
        },
      },
      required: ["path"],
    },
    riskLevel: "low",
    execute: async (args) => readFileContent(String(args.path || "")),
  },
  write_file: {
    name: "write_file",
    description:
      "Create or overwrite a local text file. Always requires user confirmation before writing.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Absolute path, or a path relative to the user's home directory",
        },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
    riskLevel: "medium",
    shouldConfirm: () => true,
    execute: async (args) =>
      writeFile(String(args.path || ""), String(args.content || "")),
  },
  open_file_or_folder: {
    name: "open_file_or_folder",
    description:
      "Open a local file or folder from an allowed local directory in the default app or file manager.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Full path to the file or folder",
        },
      },
      required: ["path"],
    },
    riskLevel: "medium",
    shouldConfirm: () => true,
    execute: async (args) => openFileOrFolder(String(args.path || "")),
  },
  open_url: {
    name: "open_url",
    description:
      "Open a URL in the default browser. Use this when the user wants to open a link.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to open",
        },
      },
      required: ["url"],
    },
    riskLevel: "medium",
    shouldConfirm: () => true,
    execute: async (args) => openUrl(String(args.url || "")),
  },
  get_system_info: {
    name: "get_system_info",
    description:
      "Get system information like CPU, memory, disk space, and OS details.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    riskLevel: "low",
    execute: async () => getSystemInfo(),
  },
  list_processes: {
    name: "list_processes",
    description:
      "List running processes. Useful to see what applications are running.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of processes to show (default 20)",
        },
      },
      required: [],
    },
    riskLevel: "low",
    execute: async (args) => listProcesses(args.limit),
  },
  clipboard_read: {
    name: "clipboard_read",
    description:
      "Read the current clipboard content. Shows text that's been copied.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    riskLevel: "low",
    execute: async () => clipboardRead(),
  },
  take_screenshot: {
    name: "take_screenshot",
    description: "Take a screenshot and save it. Returns the file path.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Optional filename (without extension)",
        },
      },
      required: [],
    },
    riskLevel: "medium",
    shouldConfirm: () => true,
    execute: async (args) => takeScreenshot(args.name),
  },
};

export const DESKTOP_TOOLS = Object.fromEntries(
  Object.entries(desktopActionRegistry).map(([name, action]) => [
    name,
    {
      name: action.name,
      description: action.description,
      parameters: action.parameters,
      riskLevel: action.riskLevel,
    },
  ]),
);

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
): Promise<ToolResult> {
  const action = desktopActionRegistry[toolName];

  if (!action) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  if (action.shouldConfirm?.(args)) {
    const confirmed = await confirmRiskyAction({
      title: "Confirm Desktop Action",
      message:
        "Clippy is requesting permission to perform a desktop action that can affect your local environment.",
      detail: `${toolName}\n\n${JSON.stringify(args, null, 2)}`,
      confirmLabel: "Allow",
    });

    if (!confirmed) {
      return {
        success: false,
        error: "Desktop action was cancelled by the user.",
      };
    }
  }

  return action.execute(args);
}

async function appendCommandLog(
  command: string,
  mode: PowerShellMode,
  success: boolean,
  result: string,
) {
  try {
    const dir = path.join(app.getPath("userData"), "logs");
    const filePath = path.join(dir, "powershell-history.log");
    await fs.promises.mkdir(dir, { recursive: true });
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      mode,
      success,
      command,
      result: result.slice(0, 1200),
    });
    await fs.promises.appendFile(filePath, `${line}\n`, "utf8");
  } catch {
    /* ignore logging failures */
  }
}

export async function openPowerShellLog(): Promise<ToolResult> {
  try {
    const filePath = getPowerShellLogPath();
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) {
      await fs.promises.writeFile(filePath, "", "utf8");
    }
    const error = await shell.openPath(filePath);
    if (error) {
      return { success: false, error };
    }
    return { success: true, output: filePath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function getPowerShellLogPath() {
  return path.join(app.getPath("userData"), "logs", "powershell-history.log");
}
