import { useContext, useState } from "react";
import {
  SharedStateContext,
  useTranslation,
} from "../contexts/SharedStateContext";
import { clippyApi } from "../clippyApi";
import {
  PermissionLevel,
  PermissionCategory,
  PermissionConfig,
} from "../../sharedState";

interface PermissionItem {
  category: PermissionCategory;
  label: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

const PERMISSION_ITEMS: PermissionItem[] = [
  {
    category: "file_read",
    label: "File Reading",
    description: "Read files and list directories",
    riskLevel: "low",
  },
  {
    category: "file_write",
    label: "File Writing",
    description: "Write, create, or modify files",
    riskLevel: "medium",
  },
  {
    category: "file_delete",
    label: "File Deletion",
    description: "Delete files and directories",
    riskLevel: "high",
  },
  {
    category: "process",
    label: "Process Management",
    description: "Start, stop, or manage processes",
    riskLevel: "high",
  },
  {
    category: "system",
    label: "System Commands",
    description: "System information and commands",
    riskLevel: "low",
  },
  {
    category: "network",
    label: "Network Operations",
    description: "Web search, fetch, and downloads",
    riskLevel: "medium",
  },
  {
    category: "registry",
    label: "Registry Operations",
    description: "Windows Registry changes",
    riskLevel: "critical",
  },
  {
    category: "app_control",
    label: "Application Control",
    description: "Open and close applications",
    riskLevel: "low",
  },
  {
    category: "screenshot",
    label: "Screenshots",
    description: "Take desktop screenshots",
    riskLevel: "low",
  },
  {
    category: "clipboard",
    label: "Clipboard",
    description: "Read and write clipboard",
    riskLevel: "low",
  },
];

const PERMISSION_LEVELS: {
  value: PermissionLevel;
  label: string;
  description: string;
}[] = [
  { value: "none", label: "None", description: "No commands allowed" },
  {
    value: "read-only",
    label: "Read Only",
    description: "Only read operations",
  },
  { value: "limited", label: "Limited", description: "Read + limited write" },
  {
    value: "full",
    label: "Full",
    description: "All operations (with confirmation)",
  },
  {
    value: "unrestricted",
    label: "Unrestricted",
    description: "All operations (no confirmation)",
  },
];

const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

export function SettingsPermissions() {
  const { settings } = useContext(SharedStateContext);
  const t = useTranslation();

  const permissionConfig = settings.permissionConfig || {
    globalLevel: "limited" as PermissionLevel,
    categoryOverrides: {},
    customBlockedPatterns: [],
    customAllowedPatterns: [],
    showConfirmations: true,
    enableLogging: true,
  };

  const [config, setConfig] = useState<PermissionConfig>(permissionConfig);

  const handleSave = async () => {
    await clippyApi.setState("settings.permissionConfig", config);
  };

  const updateGlobalLevel = (level: PermissionLevel) => {
    setConfig((prev) => ({ ...prev, globalLevel: level }));
  };

  const updateCategoryOverride = (
    category: PermissionCategory,
    level: PermissionLevel | null,
  ) => {
    setConfig((prev) => {
      const newOverrides = { ...prev.categoryOverrides };
      if (level === null) {
        delete newOverrides[category];
      } else {
        newOverrides[category] = level;
      }
      return { ...prev, categoryOverrides: newOverrides };
    });
  };

  const toggleConfirmations = () => {
    setConfig((prev) => ({
      ...prev,
      showConfirmations: !prev.showConfirmations,
    }));
  };

  const toggleLogging = () => {
    setConfig((prev) => ({ ...prev, enableLogging: !prev.enableLogging }));
  };

  const getEffectiveLevel = (category: PermissionCategory): PermissionLevel => {
    return config.categoryOverrides[category] || config.globalLevel;
  };

  return (
    <div className="settings-section">
      <h3 style={{ marginTop: 0 }}>Permissions System</h3>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
        Control what actions Clippy is allowed to perform. Higher permission
        levels allow more operations but may require confirmation.
      </p>

      {/* Global Permission Level */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: "var(--panel-soft)",
          borderRadius: 8,
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>
          Global Permission Level
        </h4>
        <p
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}
        >
          This sets the default permission level for all command categories.
        </p>
        <select
          value={config.globalLevel}
          onChange={(e) => updateGlobalLevel(e.target.value as PermissionLevel)}
          style={{ width: "100%", padding: "8px 12px", fontSize: 14 }}
        >
          {PERMISSION_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label} - {level.description}
            </option>
          ))}
        </select>
      </div>

      {/* Category Overrides */}
      <div style={{ marginBottom: 24 }}>
        <h4>Category Overrides</h4>
        <p
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}
        >
          Override the global level for specific categories.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PERMISSION_ITEMS.map((item) => (
            <div
              key={item.category}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "var(--panel-soft)",
                borderRadius: 6,
                borderLeft: `3px solid ${RISK_COLORS[item.riskLevel]}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {item.description}
                </div>
              </div>
              <select
                value={getEffectiveLevel(item.category)}
                onChange={(e) =>
                  updateCategoryOverride(
                    item.category,
                    e.target.value === config.globalLevel
                      ? null
                      : (e.target.value as PermissionLevel),
                  )
                }
                style={{ padding: "6px 10px", fontSize: 13, minWidth: 140 }}
              >
                <option value="">Use Global</option>
                {PERMISSION_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: "var(--panel-soft)",
          borderRadius: 8,
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Options</h4>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={config.showConfirmations}
            onChange={toggleConfirmations}
          />
          <span>Show confirmation dialogs for risky operations</span>
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={config.enableLogging}
            onChange={toggleLogging}
          />
          <span>Log all permission checks</span>
        </label>
      </div>

      {/* Preset Buttons */}
      <div style={{ marginBottom: 24 }}>
        <h4>Quick Presets</h4>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              setConfig({
                globalLevel: "read-only",
                categoryOverrides: {},
                customBlockedPatterns: [],
                customAllowedPatterns: [],
                showConfirmations: true,
                enableLogging: true,
              })
            }
            style={{ padding: "8px 16px" }}
          >
            🔒 Strict (Read Only)
          </button>
          <button
            type="button"
            onClick={() =>
              setConfig({
                globalLevel: "limited",
                categoryOverrides: {},
                customBlockedPatterns: [],
                customAllowedPatterns: [],
                showConfirmations: true,
                enableLogging: true,
              })
            }
            style={{ padding: "8px 16px" }}
          >
            ⚖️ Balanced (Default)
          </button>
          <button
            type="button"
            onClick={() =>
              setConfig({
                globalLevel: "full",
                categoryOverrides: {
                  registry: "none",
                  file_delete: "limited",
                },
                customBlockedPatterns: [],
                customAllowedPatterns: [],
                showConfirmations: true,
                enableLogging: true,
              })
            }
            style={{ padding: "8px 16px" }}
          >
            🛠️ Developer
          </button>
          <button
            type="button"
            onClick={() =>
              setConfig({
                globalLevel: "unrestricted",
                categoryOverrides: {},
                customBlockedPatterns: [],
                customAllowedPatterns: [],
                showConfirmations: false,
                enableLogging: true,
              })
            }
            style={{ padding: "8px 16px", color: "#ef4444" }}
          >
            ⚠️ Unrestricted (Not Recommended)
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        style={{
          padding: "10px 24px",
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Save Permissions
      </button>
    </div>
  );
}
