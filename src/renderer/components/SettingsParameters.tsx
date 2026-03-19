import { useCallback, useEffect, useState } from "react";
import { clippyApi } from "../clippyApi";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { DEFAULT_SYSTEM_PROMPT } from "../../sharedState";

export const SettingsParameters: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();
  const [tempSystemPrompt, setTempSystemPrompt] = useState(
    settings.systemPrompt || "",
  );
  const [tempTopK, setTempTopK] = useState(settings.topK || 10);
  const [tempTemperature, setTempTemperature] = useState(
    settings.temperature || 0.7,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTempSystemPrompt(settings.systemPrompt || "");
    setTempTopK(settings.topK || 10);
    setTempTemperature(settings.temperature || 0.7);
  }, [settings.systemPrompt, settings.topK, settings.temperature]);

  const handleSave = useCallback(async () => {
    const normalizedTopK =
      Number.isFinite(tempTopK) && tempTopK > 0 ? tempTopK : 10;
    const normalizedTemperature =
      Number.isFinite(tempTemperature) && tempTemperature >= 0
        ? Math.min(tempTemperature, 2)
        : 0.7;

    await clippyApi.setState("settings.systemPrompt", tempSystemPrompt);
    await clippyApi.setState("settings.topK", normalizedTopK);
    await clippyApi.setState("settings.temperature", normalizedTemperature);
    setTempTopK(normalizedTopK);
    setTempTemperature(normalizedTemperature);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [tempSystemPrompt, tempTopK, tempTemperature]);

  const handleSystemPromptReset = useCallback(() => {
    const confirmed = window.confirm(t.confirm_reset_prompt);

    if (confirmed) {
      setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    }
  }, [t.confirm_reset_prompt]);

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.prompts}</h3>
        <p>{t.prompts_description}</p>
      </div>
      <fieldset>
        <legend>{t.prompts}</legend>
        <div className="field-row-stacked">
          <label htmlFor="systemPrompt">{t.system_prompt_label}</label>
          <textarea
            id="systemPrompt"
            rows={8}
            style={{ resize: "vertical" }}
            value={tempSystemPrompt}
            onChange={(e) => setTempSystemPrompt(e.target.value)}
          />
        </div>
        <div className="field-row-stacked settings-actions-row">
          <button type="button" onClick={handleSystemPromptReset}>
            {t.reset}
          </button>
        </div>
      </fieldset>
      <fieldset style={{ marginTop: "20px" }}>
        <legend>{t.parameters}</legend>
        <div className="field-row settings-inline-field settings-number-field">
          <label htmlFor="topK">{t.top_k}</label>
          <input
            id="topK"
            type="number"
            value={tempTopK}
            step="0.1"
            onChange={(e) => setTempTopK(parseFloat(e.target.value))}
          />
        </div>
        <div className="field-row settings-inline-field settings-number-field">
          <label htmlFor="temperature">{t.temperature}</label>
          <input
            id="temperature"
            type="number"
            value={tempTemperature}
            step="0.1"
            onChange={(e) => setTempTemperature(parseFloat(e.target.value))}
          />
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
          {saved ? t.saved : t.save_changes}
        </button>
        {saved && (
          <span style={{ color: "#5cb85c", fontSize: "14px" }}>
            {t.settings_saved_successfully}
          </span>
        )}
      </div>
    </div>
  );
};
