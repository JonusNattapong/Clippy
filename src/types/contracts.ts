export interface ProviderTestResult {
  ok: boolean;
  message?: string;
  models?: string[];
}

export interface ProviderListResult {
  ok: boolean;
  message?: string;
  models?: string[];
}

export interface OllamaCheckResult {
  ok: boolean;
  message?: string;
  models?: string[];
}

export interface TelegramNotificationResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface WebSearchResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface FetchUrlResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface BackupResult {
  success: boolean;
  path?: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface BubbleTextResult {
  success: boolean;
  text?: string;
  error?: string;
}
