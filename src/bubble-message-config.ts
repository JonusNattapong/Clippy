export const BUBBLE_TEXT_TIMEOUT_MS = 12000;

export const BUBBLE_MESSAGE_PROMPT =
  "Generate a single short casual greeting or fun tip for the user (1-2 sentences max, under 60 characters). " +
  "Be playful, warm, and use emoji. Do NOT use any special tags like [MEMORY_UPDATE], [STATS_UPDATE], [TOOL_CALL], [TODO_ADD], [CHOICE], or animation tags. " +
  "Just plain friendly text. Reply in the user's preferred language.";

export const BUBBLE_MESSAGE_SYSTEM_PROMPT =
  "You are a friendly desktop assistant. Generate a very short, casual greeting or fun tip. Keep it under 60 characters. No special formatting or tags.";
