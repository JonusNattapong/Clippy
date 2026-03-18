import {
  DEFAULT_CUSTOM_THEME,
  DEFAULT_SETTINGS,
  DefaultFont,
  getThemeCssVariables,
  CustomThemeColors,
  ThemePreset,
  validateCustomTheme,
} from "../../sharedState";
import { clippyApi } from "../clippyApi";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { Checkbox } from "./Checkbox";
import { useState, useEffect, useCallback } from "react";

export const SettingsAppearance: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();

  const [uiLanguage, setUiLanguage] = useState(settings.uiLanguage || "en");
  const [clippyAlwaysOnTop, setClippyAlwaysOnTop] = useState(
    settings.clippyAlwaysOnTop ?? true,
  );
  const [chatAlwaysOnTop, setChatAlwaysOnTop] = useState(
    settings.chatAlwaysOnTop ?? true,
  );
  const [alwaysOpenChat, setAlwaysOpenChat] = useState(
    settings.alwaysOpenChat ?? false,
  );
  const [defaultFontSize, setDefaultFontSize] = useState(
    settings.defaultFontSize || 12,
  );
  const [defaultFont, setDefaultFont] = useState(
    settings.defaultFont || "Tahoma",
  );
  const [themePreset, setThemePreset] = useState<ThemePreset>(
    settings.themePreset || "classic",
  );
  const [customTheme, setCustomTheme] = useState<CustomThemeColors>(
    settings.customTheme || DEFAULT_CUSTOM_THEME,
  );
  const [saved, setSaved] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const previewThemeStyles = getThemeCssVariables(themePreset, customTheme);

  useEffect(() => {
    setUiLanguage(settings.uiLanguage || "en");
    setClippyAlwaysOnTop(settings.clippyAlwaysOnTop ?? true);
    setChatAlwaysOnTop(settings.chatAlwaysOnTop ?? true);
    setAlwaysOpenChat(settings.alwaysOpenChat ?? false);
    setDefaultFontSize(settings.defaultFontSize || 12);
    setDefaultFont(settings.defaultFont || "Tahoma");
    setThemePreset(settings.themePreset || "classic");
    setCustomTheme(settings.customTheme || DEFAULT_CUSTOM_THEME);
  }, [settings]);

  const handleSave = useCallback(async () => {
    if (themePreset === "custom") {
      const validation = validateCustomTheme(customTheme);
      if (!validation.isValid) {
        setValidationMessage(t.validation_theme_invalid);
        return;
      }
    }

    await clippyApi.setState("settings.uiLanguage", uiLanguage);
    await clippyApi.setState("settings.clippyAlwaysOnTop", clippyAlwaysOnTop);
    await clippyApi.setState("settings.chatAlwaysOnTop", chatAlwaysOnTop);
    await clippyApi.setState("settings.alwaysOpenChat", alwaysOpenChat);
    await clippyApi.setState("settings.defaultFontSize", defaultFontSize);
    await clippyApi.setState("settings.defaultFont", defaultFont);
    await clippyApi.setState("settings.themePreset", themePreset);
    await clippyApi.setState("settings.customTheme", customTheme);
    setValidationMessage("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    uiLanguage,
    clippyAlwaysOnTop,
    chatAlwaysOnTop,
    alwaysOpenChat,
    defaultFontSize,
    defaultFont,
    themePreset,
    customTheme,
    t.validation_theme_invalid,
  ]);

  const onReset = () => {
    setUiLanguage(DEFAULT_SETTINGS.uiLanguage || "en");
    setClippyAlwaysOnTop(DEFAULT_SETTINGS.clippyAlwaysOnTop ?? true);
    setChatAlwaysOnTop(DEFAULT_SETTINGS.chatAlwaysOnTop ?? true);
    setAlwaysOpenChat(DEFAULT_SETTINGS.alwaysOpenChat ?? false);
    setDefaultFontSize(DEFAULT_SETTINGS.defaultFontSize || 12);
    setDefaultFont(DEFAULT_SETTINGS.defaultFont || "Tahoma");
    setThemePreset(DEFAULT_SETTINGS.themePreset || "classic");
    setCustomTheme(DEFAULT_SETTINGS.customTheme || DEFAULT_CUSTOM_THEME);
  };

  const handleCustomThemeChange = useCallback(
    (key: keyof CustomThemeColors, value: string) => {
      setThemePreset("custom");
      setCustomTheme((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.appearance}</h3>
        <p>{t.appearance_description}</p>
      </div>

      <fieldset>
        <legend>{t.language_options}</legend>
        <div className="field-row">
          <label style={{ width: 100 }}>{t.ui_language}:</label>
          <select
            value={uiLanguage}
            onChange={(e) => setUiLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="th">ไทย (Thai)</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.window_options}</legend>
        <Checkbox
          id="clippyAlwaysOnTop"
          label={t.clippy_always_on_top}
          checked={clippyAlwaysOnTop}
          onChange={(checked) => setClippyAlwaysOnTop(checked)}
        />
        <Checkbox
          id="chatAlwaysOnTop"
          label={t.chat_always_on_top}
          checked={chatAlwaysOnTop}
          onChange={(checked) => setChatAlwaysOnTop(checked)}
        />
        <Checkbox
          id="alwaysOpenChat"
          label={t.always_open_chat}
          checked={alwaysOpenChat}
          onChange={(checked) => setAlwaysOpenChat(checked)}
        />
      </fieldset>
      <fieldset>
        <legend>{t.font_options}</legend>
        <div className="field-row settings-inline-field" style={{ width: 330 }}>
          <span style={{ width: 100 }}>{t.font_size}:</span>
          <span>8px</span>
          <input
            type="range"
            min="8"
            max="20"
            step={1}
            value={defaultFontSize}
            onChange={(e) => setDefaultFontSize(parseInt(e.target.value, 10))}
          />
          <span>20px</span>
        </div>
        <div className="field-row settings-inline-field" style={{ width: 300 }}>
          <label htmlFor="defaultFont" style={{ width: 100 }}>
            {t.font_type}:
          </label>
          <select
            id="defaultFont"
            value={defaultFont}
            onChange={(event) =>
              setDefaultFont(event.target.value as DefaultFont)
            }
          >
            <option value="Pixelated MS Sans Serif">
              Pixelated MS Sans Serif
            </option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Tahoma">Tahoma</option>
            <option value="System Default">System Default</option>
          </select>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.theme_colors}</legend>
        <div className="field-row">
          <label htmlFor="themePreset" style={{ width: 100 }}>
            {t.theme_preset}:
          </label>
          <select
            id="themePreset"
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
        <div className="settings-theme-picker-grid">
          <div className="field-row settings-theme-picker">
            <label htmlFor="themeBackground">{t.theme_background}:</label>
            <input
              id="themeBackground"
              type="color"
              value={customTheme.background}
              onChange={(event) =>
                handleCustomThemeChange("background", event.target.value)
              }
            />
          </div>
          <div className="field-row settings-theme-picker">
            <label htmlFor="themePanel">{t.theme_panel}:</label>
            <input
              id="themePanel"
              type="color"
              value={customTheme.panel}
              onChange={(event) =>
                handleCustomThemeChange("panel", event.target.value)
              }
            />
          </div>
          <div className="field-row settings-theme-picker">
            <label htmlFor="themeTitleBar">{t.theme_title_bar}:</label>
            <input
              id="themeTitleBar"
              type="color"
              value={customTheme.titleBar}
              onChange={(event) =>
                handleCustomThemeChange("titleBar", event.target.value)
              }
            />
          </div>
          <div className="field-row settings-theme-picker">
            <label htmlFor="themeAccent">{t.theme_accent}:</label>
            <input
              id="themeAccent"
              type="color"
              value={customTheme.accent}
              onChange={(event) =>
                handleCustomThemeChange("accent", event.target.value)
              }
            />
          </div>
          <div className="field-row settings-theme-picker">
            <label htmlFor="themeText">{t.theme_text}:</label>
            <input
              id="themeText"
              type="color"
              value={customTheme.text}
              onChange={(event) =>
                handleCustomThemeChange("text", event.target.value)
              }
            />
          </div>
        </div>
        <div className="settings-theme-preview-shell">
          <div className="settings-theme-preview-label">
            {t.preview}
            {themePreset === "custom" ? ` • ${t.custom_theme_colors}` : ""}
          </div>
          <div
            className="clippy settings-theme-preview"
            data-theme={themePreset}
            style={previewThemeStyles}
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
                <div className="settings-theme-preview-actions">
                  <button type="button">{t.save_changes}</button>
                  <button type="button">{t.settings}</button>
                </div>
              </div>
            </div>
          </div>
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
        {validationMessage && (
          <span style={{ color: "#b94a48", fontSize: "14px" }}>
            {validationMessage}
          </span>
        )}
        {saved && (
          <span style={{ color: "#5cb85c", fontSize: "14px" }}>
            {t.settings_saved_successfully}
          </span>
        )}
      </div>
      <div className="settings-actions-row">
        <button type="button" onClick={onReset}>
          {t.reset_appearance}
        </button>
      </div>
    </div>
  );
};
