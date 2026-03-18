import { useCallback, useMemo, useState } from "react";

import {
  API_PROVIDER_DEFAULT_MODELS,
  API_PROVIDER_LABELS,
  ApiProvider,
  CustomThemeColors,
  DEFAULT_CUSTOM_THEME,
  getThemeCssVariables,
  ThemePreset,
  validateApiConfiguration,
} from "../../sharedState";
import { clippyApi } from "../clippyApi";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";

const PROVIDERS: ApiProvider[] = [
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
];

function getProviderKeyPlaceholder(provider: ApiProvider) {
  switch (provider) {
    case "openai":
      return "sk-...";
    case "anthropic":
      return "sk-ant-...";
    case "openrouter":
      return "sk-or-...";
    case "gemini":
    default:
      return "AIza...";
  }
}

export const FirstRunSetup: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();
  const [uiLanguage, setUiLanguage] = useState(settings.uiLanguage || "th");
  const [apiProvider, setApiProvider] = useState<ApiProvider>(
    settings.apiProvider || "gemini",
  );
  const [apiKey, setApiKey] = useState(
    settings.apiKey || settings.geminiApiKey || "",
  );
  const [themePreset, setThemePreset] = useState<ThemePreset>(
    settings.themePreset || "classic",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const previewStyles = useMemo(
    () =>
      getThemeCssVariables(
        themePreset,
        (settings.customTheme || DEFAULT_CUSTOM_THEME) as CustomThemeColors,
      ),
    [settings.customTheme, themePreset],
  );

  const handleFinish = useCallback(async () => {
    const validation = validateApiConfiguration(
      apiProvider,
      apiKey,
      API_PROVIDER_DEFAULT_MODELS[apiProvider],
    );
    if (!validation.isValid) {
      setValidationMessage(t.validation_api_invalid);
      return;
    }

    setIsSaving(true);
    try {
      await clippyApi.setState("settings.uiLanguage", uiLanguage);
      await clippyApi.setState("settings.useGeminiApi", true);
      await clippyApi.setState("settings.apiProvider", apiProvider);
      await clippyApi.setState("settings.apiKey", apiKey.trim());
      if (apiProvider === "gemini") {
        await clippyApi.setState("settings.geminiApiKey", apiKey.trim());
      }
      await clippyApi.setState(
        "settings.apiModel",
        API_PROVIDER_DEFAULT_MODELS[apiProvider],
      );
      await clippyApi.setState("settings.themePreset", themePreset);
      await clippyApi.setState("settings.hasCompletedOnboarding", true);
      setValidationMessage("");
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, apiProvider, t.validation_api_invalid, themePreset, uiLanguage]);

  const handleFinishLater = useCallback(async () => {
    setIsSaving(true);
    try {
      await clippyApi.setState("settings.uiLanguage", uiLanguage);
      await clippyApi.setState("settings.themePreset", themePreset);
      await clippyApi.setState("settings.hasCompletedOnboarding", true);
    } finally {
      setIsSaving(false);
    }
  }, [themePreset, uiLanguage]);

  return (
    <div className="settings-page first-run-setup">
      <div className="settings-page-intro">
        <h3>{t.first_run_title}</h3>
        <p>{t.first_run_description}</p>
      </div>

      <fieldset>
        <legend>{t.language_options}</legend>
        <div className="field-row">
          <label htmlFor="firstRunLanguage">{t.ui_language}:</label>
          <select
            id="firstRunLanguage"
            value={uiLanguage}
            onChange={(event) => setUiLanguage(event.target.value)}
          >
            <option value="en">English</option>
            <option value="th">ไทย (Thai)</option>
          </select>
        </div>
        <p className="first-run-hint">{t.first_run_language_hint}</p>
      </fieldset>

      <fieldset>
        <legend>{t.ai_provider}</legend>
        <div className="field-row">
          <label htmlFor="firstRunProvider">{t.provider}:</label>
          <select
            id="firstRunProvider"
            value={apiProvider}
            onChange={(event) =>
              setApiProvider(event.target.value as ApiProvider)
            }
          >
            {PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {API_PROVIDER_LABELS[provider]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row-stacked">
          <label htmlFor="firstRunApiKey">{t.api_key}:</label>
          <input
            id="firstRunApiKey"
            type="password"
            value={apiKey}
            placeholder={getProviderKeyPlaceholder(apiProvider)}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <p className="first-run-hint">{t.first_run_api_hint}</p>
      </fieldset>

      <fieldset>
        <legend>{t.theme_colors}</legend>
        <div className="field-row">
          <label htmlFor="firstRunTheme">{t.theme_preset}:</label>
          <select
            id="firstRunTheme"
            value={themePreset}
            onChange={(event) =>
              setThemePreset(event.target.value as ThemePreset)
            }
          >
            <option value="classic">{t.theme_classic}</option>
            <option value="ocean">{t.theme_ocean}</option>
            <option value="forest">{t.theme_forest}</option>
            <option value="sunset">{t.theme_sunset}</option>
            <option value="midnight">{t.theme_midnight}</option>
            <option value="custom">{t.theme_custom}</option>
          </select>
        </div>
        <div className="settings-theme-preview-shell">
          <div className="settings-theme-preview-label">{t.preview}</div>
          <div
            className="clippy settings-theme-preview"
            data-theme={themePreset}
            style={previewStyles}
          >
            <div className="settings-theme-preview-window">
              <div className="settings-theme-preview-titlebar">
                <span>{t.chat_with_clippy}</span>
                <div className="settings-theme-preview-controls">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="settings-theme-preview-body">
                <div className="settings-theme-preview-swatches">
                  <span className="settings-theme-preview-swatch surface" />
                  <span className="settings-theme-preview-swatch accent" />
                  <span className="settings-theme-preview-swatch title" />
                </div>
                <div className="settings-theme-preview-progress">
                  <div className="settings-theme-preview-progress-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="settings-actions-row first-run-actions">
        <button type="button" disabled={isSaving} onClick={handleFinish}>
          {isSaving ? t.saving : t.first_run_finish}
        </button>
        <button type="button" disabled={isSaving} onClick={handleFinishLater}>
          {t.first_run_finish_later}
        </button>
      </div>
      {validationMessage && (
        <div style={{ color: "#b94a48", fontSize: "14px" }}>
          {validationMessage}
        </div>
      )}
    </div>
  );
};
