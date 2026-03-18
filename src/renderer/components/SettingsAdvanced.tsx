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
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramAllowedChatIds, setTelegramAllowedChatIds] = useState("");
  const [telegramQuietStart, setTelegramQuietStart] = useState("");
  const [telegramQuietEnd, setTelegramQuietEnd] = useState("");
  const [telegramMaxPerHour, setTelegramMaxPerHour] = useState(6);
  const [telegramTodoRemindersEnabled, setTelegramTodoRemindersEnabled] =
    useState(false);
  const [telegramTodoReminderMinutes, setTelegramTodoReminderMinutes] =
    useState(180);
  const [telegramNotifyOnTodoComplete, setTelegramNotifyOnTodoComplete] =
    useState(true);
  const [telegramNotifyOnErrors, setTelegramNotifyOnErrors] = useState(false);
  const [
    telegramAgentNotificationsEnabled,
    setTelegramAgentNotificationsEnabled,
  ] = useState(false);
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
    setTelegramEnabled(settings.telegramNotificationsEnabled || false);
    setTelegramBotToken(settings.telegramBotToken || "");
    setTelegramChatId(settings.telegramChatId || "");
    setTelegramAllowedChatIds(settings.telegramAllowedChatIds || "");
    setTelegramQuietStart(settings.telegramQuietHoursStart || "");
    setTelegramQuietEnd(settings.telegramQuietHoursEnd || "");
    setTelegramMaxPerHour(settings.telegramMaxPerHour || 6);
    setTelegramTodoRemindersEnabled(
      settings.telegramTodoRemindersEnabled || false,
    );
    setTelegramTodoReminderMinutes(settings.telegramTodoReminderMinutes || 180);
    setTelegramNotifyOnTodoComplete(
      settings.telegramNotifyOnTodoComplete ?? true,
    );
    setTelegramNotifyOnErrors(settings.telegramNotifyOnErrors || false);
    setTelegramAgentNotificationsEnabled(
      settings.telegramAgentNotificationsEnabled || false,
    );
  }, [
    settings.userMemory,
    settings.disableAutoUpdate,
    settings.powerShellMode,
    settings.telegramNotificationsEnabled,
    settings.telegramBotToken,
    settings.telegramChatId,
    settings.telegramAllowedChatIds,
    settings.telegramQuietHoursStart,
    settings.telegramQuietHoursEnd,
    settings.telegramMaxPerHour,
    settings.telegramTodoRemindersEnabled,
    settings.telegramTodoReminderMinutes,
    settings.telegramNotifyOnTodoComplete,
    settings.telegramNotifyOnErrors,
    settings.telegramAgentNotificationsEnabled,
  ]);

  const handleSave = useCallback(async () => {
    await clippyApi.setState("settings.tavilyApiKey", tavilyKey);
    await clippyApi.setState("settings.userMemory", userMemory);
    await clippyApi.setState("settings.disableAutoUpdate", disableAutoUpdate);
    await clippyApi.setState("settings.powerShellMode", powerShellMode);
    await clippyApi.setState(
      "settings.telegramNotificationsEnabled",
      telegramEnabled,
    );
    await clippyApi.setState("settings.telegramBotToken", telegramBotToken);
    await clippyApi.setState("settings.telegramChatId", telegramChatId);
    await clippyApi.setState(
      "settings.telegramAllowedChatIds",
      telegramAllowedChatIds,
    );
    await clippyApi.setState(
      "settings.telegramQuietHoursStart",
      telegramQuietStart,
    );
    await clippyApi.setState(
      "settings.telegramQuietHoursEnd",
      telegramQuietEnd,
    );
    await clippyApi.setState(
      "settings.telegramMaxPerHour",
      Math.max(1, telegramMaxPerHour),
    );
    await clippyApi.setState(
      "settings.telegramTodoRemindersEnabled",
      telegramTodoRemindersEnabled,
    );
    await clippyApi.setState(
      "settings.telegramTodoReminderMinutes",
      Math.max(5, telegramTodoReminderMinutes),
    );
    await clippyApi.setState(
      "settings.telegramNotifyOnTodoComplete",
      telegramNotifyOnTodoComplete,
    );
    await clippyApi.setState(
      "settings.telegramNotifyOnErrors",
      telegramNotifyOnErrors,
    );
    await clippyApi.setState(
      "settings.telegramAgentNotificationsEnabled",
      telegramAgentNotificationsEnabled,
    );
    setSaved(true);
    setStatusMessage(t.saved);
    setTimeout(() => setSaved(false), 2000);
  }, [
    disableAutoUpdate,
    powerShellMode,
    tavilyKey,
    t.saved,
    telegramAgentNotificationsEnabled,
    telegramAllowedChatIds,
    telegramBotToken,
    telegramChatId,
    telegramEnabled,
    telegramMaxPerHour,
    telegramNotifyOnErrors,
    telegramNotifyOnTodoComplete,
    telegramQuietEnd,
    telegramQuietStart,
    telegramTodoReminderMinutes,
    telegramTodoRemindersEnabled,
    userMemory,
  ]);

  const handleSendTelegramTest = useCallback(async () => {
    try {
      const result = await clippyApi.sendTelegramNotification({
        source: "manual",
        reason: "settings_test",
        message:
          "Clippy test notification: Telegram is connected and ready to send updates.",
        allowDuringQuietHours: true,
      });
      setStatusMessage(
        result.success ? t.telegram_test_sent : t.telegram_test_failed,
      );
    } catch (error) {
      console.error(error);
      setStatusMessage(t.telegram_test_failed);
    }
  }, [t.telegram_test_failed, t.telegram_test_sent]);

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
        <Checkbox
          id="autoApproveMemory"
          label={t.auto_approve_memory}
          checked={settings.memoryAutoApprove ?? false}
          onChange={(checked) => {
            void clippyApi.setState("settings.memoryAutoApprove", checked);
          }}
        />
        <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          {t.auto_approve_memory_description}
        </p>
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
        <legend>{t.telegram_notifications}</legend>
        <p style={{ fontSize: "12px", marginBottom: "10px" }}>
          {t.telegram_notifications_description}
        </p>
        <Checkbox
          id="telegramNotificationsEnabled"
          label={t.telegram_notifications_enabled}
          checked={telegramEnabled}
          onChange={(checked) => setTelegramEnabled(checked)}
        />
        <div className="field-row-stacked" style={{ marginTop: "10px" }}>
          <label htmlFor="telegramBotToken">{t.telegram_bot_token}</label>
          <input
            id="telegramBotToken"
            type="password"
            value={telegramBotToken}
            onChange={(e) => setTelegramBotToken(e.target.value)}
            placeholder="123456789:AA..."
            style={{ width: "100%" }}
          />
        </div>
        <div className="field-row-stacked" style={{ marginTop: "10px" }}>
          <label htmlFor="telegramChatId">{t.telegram_chat_id}</label>
          <input
            id="telegramChatId"
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="-1001234567890"
            style={{ width: "100%" }}
          />
        </div>
        <div className="field-row-stacked" style={{ marginTop: "10px" }}>
          <label htmlFor="telegramAllowedChatIds">
            {t.telegram_allowed_chat_ids}
          </label>
          <textarea
            id="telegramAllowedChatIds"
            value={telegramAllowedChatIds}
            onChange={(e) => setTelegramAllowedChatIds(e.target.value)}
            placeholder="-1001234567890, 987654321"
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
          <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
            {t.telegram_allowed_chat_ids_hint}
          </p>
        </div>
        <div className="field-row" style={{ marginTop: "10px", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="telegramQuietStart">
              {t.telegram_quiet_hours_start}
            </label>
            <input
              id="telegramQuietStart"
              type="time"
              value={telegramQuietStart}
              onChange={(e) => setTelegramQuietStart(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="telegramQuietEnd">
              {t.telegram_quiet_hours_end}
            </label>
            <input
              id="telegramQuietEnd"
              type="time"
              value={telegramQuietEnd}
              onChange={(e) => setTelegramQuietEnd(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="field-row-stacked" style={{ marginTop: "10px" }}>
          <label htmlFor="telegramMaxPerHour">{t.telegram_max_per_hour}</label>
          <input
            id="telegramMaxPerHour"
            type="number"
            min={1}
            max={60}
            value={telegramMaxPerHour}
            onChange={(e) => setTelegramMaxPerHour(Number(e.target.value) || 1)}
          />
        </div>
        <div className="field-row-stacked" style={{ marginTop: "10px" }}>
          <label htmlFor="telegramTodoReminderMinutes">
            {t.telegram_reminder_minutes}
          </label>
          <input
            id="telegramTodoReminderMinutes"
            type="number"
            min={5}
            max={1440}
            value={telegramTodoReminderMinutes}
            onChange={(e) =>
              setTelegramTodoReminderMinutes(Number(e.target.value) || 5)
            }
          />
        </div>
        <div style={{ marginTop: "12px" }}>
          <Checkbox
            id="telegramTodoRemindersEnabled"
            label={t.telegram_todo_reminders}
            checked={telegramTodoRemindersEnabled}
            onChange={(checked) => setTelegramTodoRemindersEnabled(checked)}
          />
          <Checkbox
            id="telegramNotifyOnTodoComplete"
            label={t.telegram_todo_complete}
            checked={telegramNotifyOnTodoComplete}
            onChange={(checked) => setTelegramNotifyOnTodoComplete(checked)}
          />
          <Checkbox
            id="telegramNotifyOnErrors"
            label={t.telegram_error_alerts}
            checked={telegramNotifyOnErrors}
            onChange={(checked) => setTelegramNotifyOnErrors(checked)}
          />
          <Checkbox
            id="telegramAgentNotificationsEnabled"
            label={t.telegram_agent_notifications}
            checked={telegramAgentNotificationsEnabled}
            onChange={(checked) =>
              setTelegramAgentNotificationsEnabled(checked)
            }
          />
        </div>
        <div className="settings-actions-row" style={{ marginTop: "10px" }}>
          <button type="button" onClick={handleSendTelegramTest}>
            {t.telegram_send_test}
          </button>
        </div>
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
