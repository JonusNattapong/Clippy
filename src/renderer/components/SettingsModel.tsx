import React, { useState, useEffect, useCallback } from "react";

import {
  API_PROVIDER_DEFAULT_MODELS,
  API_PROVIDER_LABELS,
  ApiProvider,
  validateApiConfiguration,
} from "../../sharedState";
import { clippyApi } from "../clippyApi";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { Checkbox } from "./Checkbox";

const PROVIDERS: ApiProvider[] = [
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
];

function getProviderKeyPlaceholder(provider: ApiProvider) {
  switch (provider) {
    case "openai":
      return "Paste your OpenAI API key here...";
    case "anthropic":
      return "Paste your Anthropic API key here...";
    case "openrouter":
      return "Paste your OpenRouter API key here...";
    case "gemini":
    default:
      return "Paste your Gemini API key here...";
  }
}

export const SettingsModel: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();

  const [useGeminiApi, setUseGeminiApi] = useState(
    settings.useGeminiApi ?? true,
  );
  const [apiProvider, setApiProvider] = useState(
    settings.apiProvider || "gemini",
  );
  const [apiKey, setApiKey] = useState(
    settings.apiKey || settings.geminiApiKey || "",
  );
  const [apiModel, setApiModel] = useState(
    settings.apiModel ||
      API_PROVIDER_DEFAULT_MODELS[settings.apiProvider || "gemini"],
  );
  const [saved, setSaved] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    setUseGeminiApi(settings.useGeminiApi ?? true);
    setApiProvider(settings.apiProvider || "gemini");
    setApiKey(settings.apiKey || settings.geminiApiKey || "");
    setApiModel(
      settings.apiModel ||
        API_PROVIDER_DEFAULT_MODELS[settings.apiProvider || "gemini"],
    );
  }, [settings]);

  const hasApiKey = !!apiKey.trim();

  const handleSave = useCallback(async () => {
    const validation = validateApiConfiguration(apiProvider, apiKey, apiModel);
    if (!validation.isValid) {
      setValidationMessage(
        !apiModel.trim()
          ? t.validation_model_required
          : t.validation_api_invalid,
      );
      return;
    }

    await clippyApi.setState("settings.useGeminiApi", useGeminiApi);
    await clippyApi.setState("settings.apiProvider", apiProvider);
    await clippyApi.setState("settings.apiKey", apiKey);
    if (apiProvider === "gemini") {
      await clippyApi.setState("settings.geminiApiKey", apiKey);
    }
    await clippyApi.setState("settings.apiModel", apiModel);
    setValidationMessage("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    apiKey,
    apiModel,
    apiProvider,
    t.validation_api_invalid,
    t.validation_model_required,
    useGeminiApi,
  ]);

  const handleProviderChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextProvider = event.target.value as ApiProvider;
    setApiProvider(nextProvider);
    if (!apiModel || apiModel === API_PROVIDER_DEFAULT_MODELS[apiProvider]) {
      setApiModel(API_PROVIDER_DEFAULT_MODELS[nextProvider]);
    }
  };

  const handleUseDefaultModel = () => {
    setApiModel(API_PROVIDER_DEFAULT_MODELS[apiProvider]);
  };

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.ai_provider}</h3>
        <p>{t.ai_provider_description}</p>
      </div>
      <fieldset>
        <legend>{t.ai_provider}</legend>
        <p style={{ marginBottom: 15 }}>{t.ai_provider_description}</p>

        <Checkbox
          id="useGeminiApi"
          label={t.use_hosted_ai}
          checked={useGeminiApi}
          onChange={(checked) => setUseGeminiApi(checked)}
        />

        <div className="field-row" style={{ marginTop: 15 }}>
          <label htmlFor="apiProvider" style={{ width: 100 }}>
            {t.provider}:
          </label>
          <select
            id="apiProvider"
            value={apiProvider}
            onChange={handleProviderChange}
            disabled={!useGeminiApi}
          >
            {PROVIDERS.map((entry) => (
              <option key={entry} value={entry}>
                {API_PROVIDER_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row-stacked" style={{ marginTop: 15 }}>
          <label htmlFor="apiKey" style={{ display: "block", marginBottom: 5 }}>
            {t.api_key}:
          </label>
          <input
            id="apiKey"
            type="password"
            style={{
              width: "100%",
            }}
            value={apiKey}
            placeholder={getProviderKeyPlaceholder(apiProvider)}
            disabled={!useGeminiApi}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: "11px", opacity: 0.85 }}>
              {hasApiKey ? t.key_saved : t.no_key_saved}
            </span>
            {hasApiKey && (
              <button
                type="button"
                disabled={!useGeminiApi}
                onClick={() => setApiKey("")}
              >
                {t.clear_key}
              </button>
            )}
          </div>
          <p style={{ fontSize: "11px", marginTop: 8, opacity: 0.8 }}>
            {t.key_hint}
          </p>
        </div>

        <div className="field-row-stacked" style={{ marginTop: 15 }}>
          <label
            htmlFor="apiModel"
            style={{ display: "block", marginBottom: 5 }}
          >
            {t.model}:
          </label>
          <input
            id="apiModel"
            type="text"
            style={{
              width: "100%",
            }}
            value={apiModel}
            placeholder={API_PROVIDER_DEFAULT_MODELS[apiProvider]}
            disabled={!useGeminiApi}
            onChange={(e) => setApiModel(e.target.value)}
          />
          <div className="settings-actions-row">
            <button
              type="button"
              disabled={!useGeminiApi}
              onClick={handleUseDefaultModel}
            >
              {t.use_default_model}
            </button>
          </div>
          <p style={{ fontSize: "11px", marginTop: 8, opacity: 0.8 }}>
            {t.default_for} {API_PROVIDER_LABELS[apiProvider]}:{" "}
            <code>{API_PROVIDER_DEFAULT_MODELS[apiProvider]}</code>
          </p>
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

      <div className="settings-callout">
        <h4>{t.api_benefits_title}</h4>
        <ul>
          <li>{t.api_benefit_1}</li>
          <li>{t.api_benefit_2}</li>
          <li>{t.api_benefit_3}</li>
          <li>{t.api_benefit_4}</li>
        </ul>
      </div>
    </div>
  );
};
