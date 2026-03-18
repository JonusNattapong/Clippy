import { ApiProvider } from "../../sharedState";

export interface ProviderTestResult {
  ok: boolean;
  message?: string;
  models?: string[];
}

export interface ProviderOptions {
  host?: string;
  apiUrl?: string;
  apiKey?: string;
}

const PROVIDER_ENDPOINTS: Record<
  ApiProvider,
  { baseUrl: string; envKey: string; modelsPath: string }
> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    modelsPath: "/models",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    modelsPath: "/models",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    modelsPath: "/models",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    envKey: "GEMINI_API_KEY",
    modelsPath: "/models",
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    envKey: "OLLAMA_HOST",
    modelsPath: "/v1/models",
  },
};

function getApiKey(provider: ApiProvider, overrideKey?: string): string | null {
  if (overrideKey) return overrideKey;
  return process.env[PROVIDER_ENDPOINTS[provider].envKey] || null;
}

function getBaseUrl(provider: ApiProvider, overrideUrl?: string): string {
  if (overrideUrl) return overrideUrl;
  if (provider === "ollama") {
    return process.env.OLLAMA_HOST || PROVIDER_ENDPOINTS.ollama.baseUrl;
  }
  return PROVIDER_ENDPOINTS[provider].baseUrl;
}

async function fetchWithAuth(
  url: string,
  provider: ApiProvider,
  apiKey: string,
  method: string = "GET",
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (provider === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  return fetch(url, { method, headers });
}

function parseModelList(provider: ApiProvider, data: any): string[] {
  if (Array.isArray(data)) return data;

  if (provider === "ollama") {
    return (data.data || []).map((m: any) => m.name || m.id);
  }

  if (data.data && Array.isArray(data.data)) {
    return data.data.map((m: any) => m.id || m.name);
  }

  if (data.models && Array.isArray(data.models)) {
    return data.models.map((m: any) => m.id || m.name);
  }

  return [];
}

export async function checkOllama(host?: string): Promise<ProviderTestResult> {
  const url = `${getBaseUrl("ollama", host)}/v1/models`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      return {
        ok: false,
        message: `Status ${res.status}: ${await res.text()}`,
      };
    }
    const json = await res.json();
    const models = parseModelList("ollama", json);
    return { ok: true, models };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

export async function testProviderConnection(
  provider: ApiProvider,
  opts?: ProviderOptions,
): Promise<ProviderTestResult> {
  if (provider === "ollama") {
    return checkOllama(opts?.host);
  }

  const apiKey = getApiKey(provider, opts?.apiKey);
  if (!apiKey) {
    return { ok: false, message: `${provider} API key missing` };
  }

  const baseUrl = getBaseUrl(provider, opts?.apiUrl);
  const modelsPath = PROVIDER_ENDPOINTS[provider].modelsPath;
  const url =
    provider === "openrouter"
      ? `${baseUrl.replace(/\/+$/, "")}${modelsPath}`
      : `${baseUrl}${modelsPath}`;

  try {
    const res = await fetchWithAuth(url, provider, apiKey);
    if (!res.ok) {
      return {
        ok: false,
        message: `Status ${res.status}: ${await res.text()}`,
      };
    }
    const json = await res.json();
    const models = parseModelList(provider, json);
    return { ok: true, models };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

export async function listProviderModels(
  provider: ApiProvider,
  opts?: ProviderOptions,
): Promise<ProviderTestResult> {
  if (provider === "ollama") {
    return checkOllama(opts?.host);
  }

  const apiKey = getApiKey(provider, opts?.apiKey);
  if (!apiKey) {
    return { ok: false, message: `${provider} API key missing` };
  }

  const baseUrl = getBaseUrl(provider, opts?.apiUrl);

  if (provider === "openrouter") {
    const tryUrls = [`${baseUrl.replace(/\/+$/, "")}/models`, baseUrl];
    for (const url of tryUrls) {
      try {
        const res = await fetchWithAuth(url, provider, apiKey);
        if (!res.ok) continue;
        const json = await res.json();
        const models = parseModelList(provider, json);
        return { ok: true, models };
      } catch {
        continue;
      }
    }
    return { ok: false, message: "OpenRouter: unable to list models" };
  }

  const modelsPath = PROVIDER_ENDPOINTS[provider].modelsPath;
  const url = `${baseUrl}${modelsPath}`;

  try {
    const res = await fetchWithAuth(url, provider, apiKey);
    if (!res.ok) {
      return {
        ok: false,
        message: `Status ${res.status}: ${await res.text()}`,
      };
    }
    const json = await res.json();
    const models = parseModelList(provider, json);
    return { ok: true, models };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

export function isProviderSupported(provider: string): provider is ApiProvider {
  return provider in PROVIDER_ENDPOINTS;
}
