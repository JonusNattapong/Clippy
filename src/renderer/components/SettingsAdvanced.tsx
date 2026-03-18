import { clippyApi } from "../clippyApi";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { Checkbox } from "./Checkbox";
import { useState, useEffect, useCallback } from "react";

export const SettingsAdvanced: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();
  const [tavilyKey, setTavilyKey] = useState("");
  const [userMemory, setUserMemory] = useState("");
  const [disableAutoUpdate, setDisableAutoUpdate] = useState(false);
  const [powerShellMode, setPowerShellMode] = useState(
    settings.powerShellMode || "safe",
  );
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    clippyApi.getState("settings.tavilyApiKey").then((key) => {
      setTavilyKey(key || "");
    });
  }, []);

  useEffect(() => {
    setUserMemory(settings.userMemory || "");
    setDisableAutoUpdate(settings.disableAutoUpdate || false);
    setPowerShellMode(settings.powerShellMode || "safe");
  }, [
    settings.userMemory,
    settings.disableAutoUpdate,
    settings.powerShellMode,
  ]);

  const handleSave = useCallback(async () => {
    await clippyApi.setState("settings.tavilyApiKey", tavilyKey);
    await clippyApi.setState("settings.userMemory", userMemory);
    await clippyApi.setState("settings.disableAutoUpdate", disableAutoUpdate);
    await clippyApi.setState("settings.powerShellMode", powerShellMode);
    setSaved(true);
    setStatusMessage(t.saved);
    setTimeout(() => setSaved(false), 2000);
  }, [disableAutoUpdate, powerShellMode, tavilyKey, t.saved, userMemory]);

  const handleExportBackup = useCallback(async () => {
    try {
      const result = await clippyApi.exportBackup();
      setStatusMessage(result.success ? t.backup_exported : "");
    } catch (error) {
      console.error(error);
      setStatusMessage(t.backup_failed);
    }
  }, [t.backup_exported, t.backup_failed]);

  const handleImportBackup = useCallback(async () => {
    try {
      const result = await clippyApi.importBackup();
      setStatusMessage(result.success ? t.backup_imported : "");
      if (result.success) {
        window.setTimeout(() => window.location.reload(), 400);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(t.backup_failed);
    }
  }, [t.backup_failed, t.backup_imported]);

  const handleOpenPowerShellLog = useCallback(async () => {
    try {
      await clippyApi.openPowerShellLog();
      setStatusMessage(t.powershell_log_opened);
    } catch (error) {
      console.error(error);
      setStatusMessage(t.backup_failed);
    }
  }, [t.backup_failed, t.powershell_log_opened]);

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.advanced}</h3>
        <p>{t.advanced_description}</p>
      </div>
      <fieldset>
        <legend>{t.tavily_api_key}</legend>
        <p style={{ fontSize: "12px", marginBottom: "10px" }}>
          {t.tavily_description}{" "}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "blue",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
            onClick={() => {
              require("electron").shell.openExternal("https://app.tavily.com");
            }}
          >
            app.tavily.com
          </button>
        </p>
        <div className="field-row">
          <input
            type="password"
            value={tavilyKey}
            onChange={(e) => setTavilyKey(e.target.value)}
            placeholder="tvly-xxxxx..."
            style={{ flex: 1 }}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.powershell_mode}</legend>
        <p style={{ fontSize: "12px", marginBottom: "10px" }}>
          {t.powershell_mode_description}
        </p>
        <div className="field-row">
          <label htmlFor="powerShellMode">{t.powershell_mode}:</label>
          <select
            id="powerShellMode"
            value={powerShellMode}
            onChange={(e) =>
              setPowerShellMode(e.target.value as "safe" | "full")
            }
          >
            <option value="safe">{t.powershell_mode_safe}</option>
            <option value="full">{t.powershell_mode_full}</option>
          </select>
        </div>
        <div className="settings-actions-row" style={{ marginTop: "10px" }}>
          <button type="button" onClick={handleOpenPowerShellLog}>
            {t.open_powershell_log}
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.auto_updates}</legend>
        <Checkbox
          id="autoUpdates"
          label={t.auto_updates_label}
          checked={!disableAutoUpdate}
          onChange={(checked) => {
            setDisableAutoUpdate(!checked);
          }}
        />

        <div className="settings-actions-row">
          <button type="button" onClick={() => clippyApi.checkForUpdates()}>
            {t.check_for_updates}
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.memory_legend}</legend>
        <p>{t.memory_description}</p>
        <textarea
          style={{
            width: "100%",
            height: "80px",
            marginTop: "10px",
            resize: "none",
          }}
          value={userMemory}
          onChange={(e) => setUserMemory(e.target.value)}
        />
      </fieldset>
      <fieldset>
        <legend>{t.configuration}</legend>
        <p>{t.configuration_description}</p>
        <p style={{ fontSize: "12px", color: "var(--premium-muted)" }}>
          {t.backup_description}
        </p>
        <div className="settings-actions-row">
          <button type="button" onClick={clippyApi.openStateInEditor}>
            {t.open_config_file}
          </button>
          <button type="button" onClick={clippyApi.openDebugStateInEditor}>
            {t.open_debug_file}
          </button>
          <button type="button" onClick={handleExportBackup}>
            {t.export_backup}
          </button>
          <button type="button" onClick={handleImportBackup}>
            {t.import_backup}
          </button>
        </div>
      </fieldset>
      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button type="button" onClick={handleSave}>
          {saved ? t.saved : t.save_settings}
        </button>
        {statusMessage && (
          <span
            style={{
              color: statusMessage === t.backup_failed ? "#b94a48" : "#5cb85c",
              fontSize: "14px",
            }}
          >
            {statusMessage}
          </span>
        )}
      </div>
    </div>
  );
};
