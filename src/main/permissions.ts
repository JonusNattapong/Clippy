/**
 * Permissions System for Clippy
 * Controls what actions are allowed based on user configuration
 */

export type PermissionLevel =
  | "none" // No commands allowed
  | "read-only" // Only read operations
  | "limited" // Read + limited write operations
  | "full" // All operations with confirmation
  | "unrestricted"; // All operations without confirmation

export type PermissionCategory =
  | "file_read" // Read files and directories
  | "file_write" // Write, create, modify files
  | "file_delete" // Delete files and directories
  | "process" // Process management
  | "system" // System information and commands
  | "network" // Network operations
  | "registry" // Registry operations
  | "app_control" // Open/close applications
  | "screenshot" // Take screenshots
  | "clipboard"; // Clipboard operations

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Permission {
  category: PermissionCategory;
  description: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  allowedLevels: PermissionLevel[];
}

export interface PermissionConfig {
  // Global permission level
  globalLevel: PermissionLevel;

  // Per-category overrides (if set, overrides global level)
  categoryOverrides: Partial<Record<PermissionCategory, PermissionLevel>>;

  // Custom blocked patterns (additional to built-in blocked patterns)
  customBlockedPatterns: string[];

  // Custom allowed patterns (additional to built-in safe patterns)
  customAllowedPatterns: string[];

  // Whether to show confirmation dialogs
  showConfirmations: boolean;

  // Log all permission checks
  enableLogging: boolean;
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  {
    category: "file_read",
    description: "Read files and list directories",
    riskLevel: "low",
    requiresConfirmation: false,
    allowedLevels: ["read-only", "limited", "full", "unrestricted"],
  },
  {
    category: "file_write",
    description: "Write, create, or modify files",
    riskLevel: "medium",
    requiresConfirmation: true,
    allowedLevels: ["limited", "full", "unrestricted"],
  },
  {
    category: "file_delete",
    description: "Delete files and directories",
    riskLevel: "high",
    requiresConfirmation: true,
    allowedLevels: ["full", "unrestricted"],
  },
  {
    category: "process",
    description: "Start, stop, or manage processes",
    riskLevel: "high",
    requiresConfirmation: true,
    allowedLevels: ["full", "unrestricted"],
  },
  {
    category: "system",
    description: "System information and commands",
    riskLevel: "low",
    requiresConfirmation: false,
    allowedLevels: ["read-only", "limited", "full", "unrestricted"],
  },
  {
    category: "network",
    description: "Network operations and downloads",
    riskLevel: "medium",
    requiresConfirmation: true,
    allowedLevels: ["limited", "full", "unrestricted"],
  },
  {
    category: "registry",
    description: "Windows Registry operations",
    riskLevel: "critical",
    requiresConfirmation: true,
    allowedLevels: ["full", "unrestricted"],
  },
  {
    category: "app_control",
    description: "Open and close applications",
    riskLevel: "low",
    requiresConfirmation: false,
    allowedLevels: ["read-only", "limited", "full", "unrestricted"],
  },
  {
    category: "screenshot",
    description: "Take desktop screenshots",
    riskLevel: "low",
    requiresConfirmation: false,
    allowedLevels: ["read-only", "limited", "full", "unrestricted"],
  },
  {
    category: "clipboard",
    description: "Read and write clipboard",
    riskLevel: "low",
    requiresConfirmation: false,
    allowedLevels: ["read-only", "limited", "full", "unrestricted"],
  },
];

export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  globalLevel: "limited",
  categoryOverrides: {},
  customBlockedPatterns: [],
  customAllowedPatterns: [],
  showConfirmations: true,
  enableLogging: true,
};

// Commands that always require confirmation regardless of level
export const ALWAYS_CONFIRM_PATTERNS: RegExp[] = [
  /\bRemove-Item\b/i,
  /\bDelete\b/i,
  /\bStop-Process\b/i,
  /\btaskkill\b/i,
  /\bshutdown\b/i,
  /\bRestart-Computer\b/i,
  /\bFormat-Volume\b/i,
  /\bdiskpart\b/i,
  /\breg\s+delete\b/i,
  /\bSet-ExecutionPolicy\b/i,
];

// Commands that are always blocked
export const ALWAYS_BLOCKED_PATTERNS: RegExp[] = [
  /\bInvoke-Expression\b/i,
  /\biex\b/i,
  /\b[Convert]::FromBase64String\b/i,
  /\bInvoke-WebRequest.*-UseBasicParsing.*-OutFile\b/i,
];

/**
 * Map command categories to their respective permission categories
 */
export function getPermissionCategory(command: string): PermissionCategory {
  const cmd = command.toLowerCase();

  // File operations
  if (/^(ls|list|dir|cat|read|get-content|get-childitem)/i.test(cmd)) {
    return "file_read";
  }
  if (/^(write|set-content|add-content|new-item|out-file)/i.test(cmd)) {
    return "file_write";
  }
  if (/^(rm|remove|del|remove-item|clear-content)/i.test(cmd)) {
    return "file_delete";
  }

  // Process operations
  if (/^(ps|get-process|stop-process|start-process|taskkill)/i.test(cmd)) {
    return "process";
  }

  // System information
  if (
    /^(sysinfo|get-computerinfo|get-service|get-date|get-location)/i.test(cmd)
  ) {
    return "system";
  }

  // Network operations
  if (/^(search|google|fetch|curl|wget|invoke-webrequest)/i.test(cmd)) {
    return "network";
  }

  // Registry operations
  if (/^(reg\s|registry)/i.test(cmd)) {
    return "registry";
  }

  // Application control
  if (/^(open|launch|start|close)/i.test(cmd)) {
    return "app_control";
  }

  // Screenshot
  if (/^screenshot/i.test(cmd)) {
    return "screenshot";
  }

  // Clipboard
  if (/^clipboard/i.test(cmd)) {
    return "clipboard";
  }

  // Default to system for unknown commands
  return "system";
}

/**
 * Check if a command matches any pattern
 */
export function matchesPattern(command: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(command));
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  category: PermissionCategory;
  riskLevel: RiskLevel;
}

/**
 * Check if a command is allowed based on permission configuration
 */
export function checkPermission(
  command: string,
  config: PermissionConfig,
  permissions: Permission[] = DEFAULT_PERMISSIONS,
): PermissionCheckResult {
  const category = getPermissionCategory(command);
  const permission = permissions.find((p) => p.category === category);

  if (!permission) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: `Unknown permission category: ${category}`,
      category,
      riskLevel: "medium",
    };
  }

  // Check if command is always blocked
  if (matchesPattern(command, ALWAYS_BLOCKED_PATTERNS)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: "This command is permanently blocked for security reasons.",
      category,
      riskLevel: "critical",
    };
  }

  // Determine effective permission level
  const effectiveLevel =
    config.categoryOverrides[category] || config.globalLevel;

  // Check if level allows this category
  if (!permission.allowedLevels.includes(effectiveLevel)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: `Permission level "${effectiveLevel}" does not allow ${permission.description.toLowerCase()}.`,
      category,
      riskLevel: permission.riskLevel,
    };
  }

  // Check custom blocked patterns
  const customBlocked = config.customBlockedPatterns.map(
    (p) => new RegExp(p, "i"),
  );
  if (matchesPattern(command, customBlocked)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reason: "This command matches a custom blocked pattern.",
      category,
      riskLevel: permission.riskLevel,
    };
  }

  // Check if confirmation is required
  const needsConfirmation =
    config.showConfirmations &&
    (permission.requiresConfirmation ||
      matchesPattern(command, ALWAYS_CONFIRM_PATTERNS) ||
      effectiveLevel === "full");

  return {
    allowed: true,
    requiresConfirmation: needsConfirmation,
    category,
    riskLevel: permission.riskLevel,
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "low":
      return "#10b981"; // green
    case "medium":
      return "#f59e0b"; // amber
    case "high":
      return "#ef4444"; // red
    case "critical":
      return "#dc2626"; // dark red
    default:
      return "#6b7280"; // gray
  }
}

/**
 * Get risk level icon for UI
 */
export function getRiskLevelIcon(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "low":
      return "🔒";
    case "medium":
      return "⚠️";
    case "high":
      return "🚨";
    case "critical":
      return "⛔";
    default:
      return "❓";
  }
}
