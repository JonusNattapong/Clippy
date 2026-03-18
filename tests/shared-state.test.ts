import test from "node:test";
import assert from "node:assert/strict";

import {
  buildThemePalette,
  DEFAULT_CUSTOM_THEME,
  getThemeCssVariables,
  validateApiConfiguration,
  validateCustomTheme,
  API_PROVIDER_DEFAULT_MODELS,
  API_PROVIDER_LABELS,
} from "../src/sharedState";

test("buildThemePalette returns preset colors for classic theme", () => {
  const palette = buildThemePalette("classic");

  assert.equal(palette.bg, "#fff7c7");
  assert.equal(palette.accent, "#2d6fbe");
});

test("buildThemePalette derives custom palette values", () => {
  const palette = buildThemePalette("custom", DEFAULT_CUSTOM_THEME);

  assert.equal(palette.bg, DEFAULT_CUSTOM_THEME.background);
  assert.equal(palette.text, DEFAULT_CUSTOM_THEME.text);
  assert.match(palette.accentGlow, /^rgba\(/);
});

test("buildThemePalette returns ocean theme colors", () => {
  const palette = buildThemePalette("ocean");

  assert.equal(palette.bg, "#dff3ff");
  assert.equal(palette.accent, "#2474a6");
});

test("buildThemePalette returns forest theme colors", () => {
  const palette = buildThemePalette("forest");

  assert.equal(palette.bg, "#e6f1d9");
  assert.equal(palette.accent, "#3f7a45");
});

test("buildThemePalette returns sunset theme colors", () => {
  const palette = buildThemePalette("sunset");

  assert.equal(palette.bg, "#ffe7d4");
  assert.equal(palette.accent, "#c2673f");
});

test("buildThemePalette returns midnight theme colors", () => {
  const palette = buildThemePalette("midnight");

  assert.equal(palette.bg, "#202733");
  assert.equal(palette.accent, "#7cc0ff");
});

test("getThemeCssVariables returns css variable map", () => {
  const variables = getThemeCssVariables("custom", DEFAULT_CUSTOM_THEME);

  assert.equal(variables["--premium-bg"], DEFAULT_CUSTOM_THEME.background);
  assert.equal(variables["--premium-text"], DEFAULT_CUSTOM_THEME.text);
});

test("validateApiConfiguration rejects empty model", () => {
  const result = validateApiConfiguration("openai", "sk-test", "");

  assert.equal(result.isValid, false);
});

test("validateApiConfiguration rejects whitespace-only model", () => {
  const result = validateApiConfiguration("openai", "sk-test", "   ");

  assert.equal(result.isValid, false);
});

test("validateApiConfiguration rejects mismatched provider key prefix", () => {
  const result = validateApiConfiguration("anthropic", "sk-test", "claude");

  assert.equal(result.isValid, false);
});

test("validateApiConfiguration accepts ollama provider without api key", () => {
  const result = validateApiConfiguration("ollama", "", "llama2");

  assert.equal(result.isValid, true);
});

test("validateApiConfiguration accepts ollama with any model", () => {
  const result = validateApiConfiguration("ollama", "", "llama3.2");

  assert.equal(result.isValid, true);
});

test("validateApiConfiguration accepts openai with sk- prefix", () => {
  const result = validateApiConfiguration("openai", "sk-abc123", "gpt-4");

  assert.equal(result.isValid, true);
});

test("validateApiConfiguration accepts anthropic with sk-ant- prefix", () => {
  const result = validateApiConfiguration(
    "anthropic",
    "sk-ant-abc123",
    "claude-3",
  );

  assert.equal(result.isValid, true);
});

test("validateApiConfiguration accepts openrouter with multiple prefixes", () => {
  const result1 = validateApiConfiguration(
    "openrouter",
    "sk-or-v1-abc123",
    "gpt-4",
  );
  const result2 = validateApiConfiguration("openrouter", "sk-abc123", "gpt-4");

  assert.equal(result1.isValid, true);
  assert.equal(result2.isValid, true);
});

test("validateApiConfiguration accepts gemini with AIza prefix", () => {
  const result = validateApiConfiguration(
    "gemini",
    "AIzaSyABC123",
    "gemini-1.5",
  );

  assert.equal(result.isValid, true);
});

test("validateApiConfiguration returns valid for provider without key requirement", () => {
  const result = validateApiConfiguration("gemini", "", "gemini-1.5-flash");

  assert.equal(result.isValid, true);
});

test("validateCustomTheme accepts valid hex values", () => {
  const result = validateCustomTheme(DEFAULT_CUSTOM_THEME);

  assert.equal(result.isValid, true);
});

test("validateCustomTheme rejects invalid hex values", () => {
  const result = validateCustomTheme({
    ...DEFAULT_CUSTOM_THEME,
    accent: "blue",
  });

  assert.equal(result.isValid, false);
});

test("validateCustomTheme rejects short hex values", () => {
  const result = validateCustomTheme({
    ...DEFAULT_CUSTOM_THEME,
    accent: "#fff",
  });

  assert.equal(result.isValid, false);
});

test("validateCustomTheme rejects uppercase hex values", () => {
  const result = validateCustomTheme({
    ...DEFAULT_CUSTOM_THEME,
    accent: "#FFF",
  });

  assert.equal(result.isValid, false);
});

test("validateCustomTheme validates all color fields", () => {
  const result = validateCustomTheme({
    background: "#ffffff",
    panel: "#fffffe",
    titleBar: "#7e8798",
    accent: "#2d6fbe",
    text: "#363224",
  });

  assert.equal(result.isValid, true);
});

test("API_PROVIDER_DEFAULT_MODELS contains all providers", () => {
  assert.ok(API_PROVIDER_DEFAULT_MODELS.gemini);
  assert.ok(API_PROVIDER_DEFAULT_MODELS.openai);
  assert.ok(API_PROVIDER_DEFAULT_MODELS.anthropic);
  assert.ok(API_PROVIDER_DEFAULT_MODELS.openrouter);
  assert.ok(API_PROVIDER_DEFAULT_MODELS.ollama);
});

test("API_PROVIDER_LABELS contains all providers", () => {
  assert.equal(API_PROVIDER_LABELS.gemini, "Google Gemini");
  assert.equal(API_PROVIDER_LABELS.openai, "OpenAI");
  assert.equal(API_PROVIDER_LABELS.anthropic, "Anthropic");
  assert.equal(API_PROVIDER_LABELS.openrouter, "OpenRouter");
  assert.equal(API_PROVIDER_LABELS.ollama, "Ollama");
});
