import test from "node:test";
import assert from "node:assert/strict";

import {
  buildThemePalette,
  DEFAULT_CUSTOM_THEME,
  getThemeCssVariables,
  validateApiConfiguration,
  validateCustomTheme,
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

test("getThemeCssVariables returns css variable map", () => {
  const variables = getThemeCssVariables("custom", DEFAULT_CUSTOM_THEME);

  assert.equal(variables["--premium-bg"], DEFAULT_CUSTOM_THEME.background);
  assert.equal(variables["--premium-text"], DEFAULT_CUSTOM_THEME.text);
});

test("validateApiConfiguration rejects empty model", () => {
  const result = validateApiConfiguration("openai", "sk-test", "");

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
