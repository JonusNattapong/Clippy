import React, { useState, useEffect, useCallback } from "react";

import {
  API_PROVIDER_DEFAULT_MODELS,
  API_PROVIDER_LABELS,
  API_PROVIDER_MODELS,
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
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsInfo, setSkillsInfo] = useState<{
    ok: boolean;
    message?: string;
    statuses?: Array<{
      id: string;
      enabled: boolean;
      loaded: boolean;
      error?: string;
    }>;
    skillsDir?: string;
  } | null>(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillStatusFilter, setSkillStatusFilter] = useState<
    "all" | "loaded" | "unloaded" | "error"
  >("all");
  // Ollama detection
  const [ollamaHost, setOllamaHost] = useState<string>(
    (settings as any).ollamaHost ||
      (typeof process !== "undefined"
        ? (process.env as any)?.OLLAMA_HOST
        : undefined) ||
      "http://localhost:11434",
  );
  const [ollamaChecking, setOllamaChecking] = useState(false);
  const [ollamaInfo, setOllamaInfo] = useState<null | {
    ok: boolean;
    message?: string;
    models?: any;
  }>(null);

  // Provider test / models listing state
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<null | {
    ok: boolean;
    message?: string;
    models?: any;
  }>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsList, setModelsList] = useState<string[] | null>(null);
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

  useEffect(() => {
    // Fetch skills status on mount
    let mounted = true;
    async function fetchSkills() {
      setSkillsLoading(true);
      try {
        const res = await clippyApi.checkSkillStatuses();
        if (!mounted) return;
        setSkillsInfo(res);
      } catch (err) {
        if (!mounted) return;
        setSkillsInfo({ ok: false, message: String(err) });
      } finally {
        if (mounted) setSkillsLoading(false);
      }
    }

    fetchSkills();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Auto-check Ollama on mount or when saved host changes
    let mounted = true;
    async function detectOllama() {
      setOllamaChecking(true);
      try {
        const res = await clippyApi.checkOllama(ollamaHost);
        if (!mounted) return;
        setOllamaInfo(res);
      } catch (err) {
        if (!mounted) return;
        setOllamaInfo({ ok: false, message: String(err) });
      } finally {
        if (mounted) setOllamaChecking(false);
      }
    }

    detectOllama();
    return () => {
      mounted = false;
    };
  }, [ollamaHost]);

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

        {/* Provider test / list actions */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={async () => {
              setTestLoading(true);
              setTestResult(null);
              try {
                const res = await clippyApi.testProviderConnection(
                  useGeminiApi ? apiProvider : "ollama",
                  { host: ollamaHost, apiKey },
                );
                setTestResult(res);
              } catch (e) {
                setTestResult({ ok: false, message: String(e) });
              } finally {
                setTestLoading(false);
              }
            }}
            disabled={testLoading}
          >
            {testLoading
              ? "Testing..."
              : t.test_connection || "Test connection"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setModelsLoading(true);
              setModelsList(null);
              try {
                const res = await clippyApi.listProviderModels(
                  useGeminiApi ? apiProvider : "ollama",
                  { host: ollamaHost, apiKey },
                );
                if (res && res.ok && Array.isArray(res.models)) {
                  const normalized = res.models
                    .map((m: any) =>
                      typeof m === "string"
                        ? m
                        : m.id || m.name || JSON.stringify(m),
                    )
                    .filter(Boolean);
                  setModelsList(normalized as string[]);
                } else if (res && res.ok && res.models) {
                  // Try to coerce non-array into string list
                  setModelsList([String(res.models)]);
                } else {
                  setModelsList([]);
                }
              } catch (e) {
                setModelsList([]);
              } finally {
                setModelsLoading(false);
              }
            }}
            disabled={modelsLoading}
          >
            {modelsLoading ? "Listing..." : t.list_models || "List models"}
          </button>

          {testResult ? (
            <span
              style={{
                marginLeft: 8,
                color: testResult.ok ? "#2d6f2d" : "#b94a48",
              }}
            >
              {testResult.ok ? "✅" : "❌"}{" "}
              {testResult.message || (testResult.ok ? "OK" : "Error")}
            </span>
          ) : null}
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
          {modelsList && modelsList.length > 0 ? (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Detected models from provider:
              </label>
              <select
                value={apiModel}
                onChange={(e) => setApiModel(e.target.value)}
                style={{ width: "100%" }}
              >
                {modelsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Available models:
              </label>
              <select
                value={apiModel}
                onChange={(e) => setApiModel(e.target.value)}
                style={{ width: "100%" }}
              >
                {API_PROVIDER_MODELS[
                  useGeminiApi ? apiProvider : "ollama"
                ]?.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      <fieldset style={{ marginTop: 16 }}>
        <legend>Skills</legend>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            {skillsLoading ? (
              <span>Checking skills...</span>
            ) : skillsInfo ? (
              skillsInfo.ok ? (
                <div style={{ color: "#2d6f2d" }}>
                  ✅ Skills loaded: {skillsInfo.statuses?.length ?? 0}
                  {skillsInfo.skillsDir ? (
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      Dir: {skillsInfo.skillsDir}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ color: "#b94a48" }}>
                  ❌ Skills error: {skillsInfo.message}
                </div>
              )
            ) : (
              <span style={{ opacity: 0.8 }}>No skills info</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={async () => {
              setSkillsLoading(true);
              try {
                await clippyApi.checkSkillStatuses();
              } finally {
                setSkillsLoading(false);
              }
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            aria-label="Search skills"
            placeholder="Search skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
          <select
            value={skillStatusFilter}
            onChange={(e) => setSkillStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="loaded">Loaded</option>
            <option value="unloaded">Unloaded</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          {skillsInfo?.ok &&
          skillsInfo.statuses &&
          skillsInfo.statuses.length > 0 ? (
            (() => {
              const q = skillSearch.trim().toLowerCase();
              const filtered = skillsInfo.statuses!.filter((s) => {
                if (q) {
                  if (
                    !s.id.toLowerCase().includes(q) &&
                    !(s.error || "").toLowerCase().includes(q)
                  )
                    return false;
                }
                if (skillStatusFilter === "loaded" && !s.loaded) return false;
                if (skillStatusFilter === "unloaded" && s.loaded) return false;
                if (skillStatusFilter === "error" && !s.error) return false;
                return true;
              });

              return filtered.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 6 }}>Status</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Skill</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Enabled</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Loaded</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: 6 }}>
                          {s.loaded ? (
                            <span style={{ color: "#2d6f2d" }}>●</span>
                          ) : s.error ? (
                            <span style={{ color: "#b94a48" }}>●</span>
                          ) : (
                            <span style={{ color: "#c0a000" }}>●</span>
                          )}
                        </td>
                        <td style={{ padding: 6 }}>{s.id}</td>
                        <td style={{ padding: 6 }}>
                          {s.enabled ? "Yes" : "No"}
                        </td>
                        <td style={{ padding: 6 }}>
                          {s.loaded ? "Yes" : "No"}
                        </td>
                        <td style={{ padding: 6, color: "#b94a48" }}>
                          {s.error || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ opacity: 0.8 }}>No skills match your filter</div>
              );
            })()
          ) : (
            <div style={{ opacity: 0.8 }}>No skills loaded</div>
          )}
        </div>
      </fieldset>
    </div>
  );
};
