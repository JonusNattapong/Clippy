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

// Cloud providers (require API key)
const CLOUD_PROVIDERS: ApiProvider[] = [
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
];

export const SettingsModel: React.FC = () => {
  const { settings } = useSharedState();
  const t = useTranslation();

  const [useGeminiApi, setUseGeminiApi] = useState(
    settings.useGeminiApi ?? true,
  );
  // When useGeminiApi is true, we show cloud provider selection
  // When false, we use Ollama (local provider)
  const [apiProvider, setApiProvider] = useState(
    // If useGeminiApi is false, we force Ollama
    useGeminiApi ? settings.apiProvider || "gemini" : "ollama",
  );
  const [apiKey, setApiKey] = useState(
    // For Ollama, we don't use the API key field (but we still store it in state for consistency)
    settings.apiKey || settings.geminiApiKey || "",
  );
  const [apiModel, setApiModel] = useState(
    settings.apiModel ||
      API_PROVIDER_DEFAULT_MODELS[
        useGeminiApi ? settings.apiProvider || "gemini" : "ollama"
      ],
  );
  const [saved, setSaved] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    // Sync with settings
    setUseGeminiApi(settings.useGeminiApi ?? true);
    // When useGeminiApi is false, we ignore the saved apiProvider and use Ollama
    setApiProvider(useGeminiApi ? settings.apiProvider || "gemini" : "ollama");
    setApiKey(settings.apiKey || settings.geminiApiKey || "");
    setApiModel(
      settings.apiModel ||
        API_PROVIDER_DEFAULT_MODELS[
          useGeminiApi ? settings.apiProvider || "gemini" : "ollama"
        ],
    );
  }, [settings, useGeminiApi]); // Added useGeminiApi to dependencies

  const hasApiKey = !!apiKey.trim();

  const handleSave = useCallback(async () => {
    // For Ollama, we don't validate the API key (it's not required)
    const validation = useGeminiApi
      ? validateApiConfiguration(apiProvider, apiKey, apiModel)
      : { isValid: true }; // Ollama doesn't need API key validation
    if (!validation.isValid) {
      setValidationMessage(
        !apiModel.trim()
          ? t.validation_model_required
          : t.validation_api_invalid,
      );
      return;
    }

    // When useGeminiApi is false, we are using Ollama so we save the provider as ollama
    await clippyApi.setState("settings.useGeminiApi", useGeminiApi);
    await clippyApi.setState(
      "settings.apiProvider",
      useGeminiApi ? apiProvider : "ollama",
    );
    await clippyApi.setState("settings.apiKey", apiKey);
    // For gemini provider, we also save to geminiApiKey for backward compatibility
    if (useGeminiApi && apiProvider === "gemini") {
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
    // Only change provider if useGeminiApi is true (cloud provider selected)
    if (useGeminiApi) {
      const nextProvider = event.target.value as ApiProvider;
      setApiProvider(nextProvider);
      if (!apiModel || apiModel === API_PROVIDER_DEFAULT_MODELS[apiProvider]) {
        setApiModel(API_PROVIDER_DEFAULT_MODELS[nextProvider]);
      }
    }
  };

  const handleUseDefaultModel = () => {
    setApiModel(
      API_PROVIDER_DEFAULT_MODELS[useGeminiApi ? apiProvider : "ollama"],
    );
  };

  // Get placeholder for API key input
  function getProviderKeyPlaceholder(provider: ApiProvider) {
    switch (provider) {
      case "openai":
        return "Paste your OpenAI API key here...";
      case "anthropic":
        return "Paste your Anthropic API key here...";
      case "openrouter":
        return "Paste your OpenRouter API key here...";
      case "ollama":
        return "No API key needed for local Ollama";
      case "gemini":
      default:
        return "Paste your Gemini API key here...";
    }
  }

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

        {/* When using cloud AI provider, show provider selection */}
        {useGeminiApi && (
          <div className="field-row" style={{ marginTop: 15 }}>
            <label htmlFor="apiProvider" style={{ width: 100 }}>
              {t.provider}:
            </label>
            <select
              id="apiProvider"
              value={apiProvider}
              onChange={handleProviderChange}
            >
              {CLOUD_PROVIDERS.map((entry) => (
                <option key={entry} value={entry}>
                  {API_PROVIDER_LABELS[entry]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API key input - disabled when using Ollama (local provider) */}
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
            placeholder={getProviderKeyPlaceholder(
              useGeminiApi ? apiProvider : "ollama",
            )}
            disabled={!useGeminiApi} // Disabled when using Ollama (local provider)
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
                disabled={!useGeminiApi} // Only allow clearing when not using Ollama
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

        {/* Model input */}
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
            placeholder={
              API_PROVIDER_DEFAULT_MODELS[useGeminiApi ? apiProvider : "ollama"]
            }
            onChange={(e) => setApiModel(e.target.value)}
          />
          <div className="settings-actions-row">
            <button type="button" onClick={handleUseDefaultModel}>
              {t.use_default_model}
            </button>
          </div>
          <p style={{ fontSize: "11px", marginTop: 8, opacity: 0.8 }}>
            {t.default_for}{" "}
            {useGeminiApi ? API_PROVIDER_LABELS[apiProvider] : "Ollama"}:{" "}
            <code>
              {
                API_PROVIDER_DEFAULT_MODELS[
                  useGeminiApi ? apiProvider : "ollama"
                ]
              }
            </code>
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
