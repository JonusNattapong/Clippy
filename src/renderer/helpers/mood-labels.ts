import { Translations } from "../i18n";
import type { MemoryStats } from "../../types/interfaces";

export function getMoodLabel(
  mood: MemoryStats["mood"]["primary"],
  t: Translations,
): string {
  switch (mood) {
    case "playful":
      return t.mood_playful;
    case "supportive":
      return t.mood_supportive;
    case "excited":
      return t.mood_excited;
    case "focused":
      return t.mood_focused;
    case "concerned":
      return t.mood_concerned;
    case "calm":
    default:
      return t.mood_calm;
  }
}

export function getResponseStyleLabel(
  style: MemoryStats["mood"]["responseStyle"],
  t: Translations,
): string {
  switch (style) {
    case "gentle":
      return t.response_gentle;
    case "energetic":
      return t.response_energetic;
    case "balanced":
    default:
      return t.response_balanced;
  }
}

export function getUserToneLabel(
  tone: MemoryStats["mood"]["userTone"],
  t: Translations,
): string {
  switch (tone) {
    case "positive":
      return t.tone_positive;
    case "affectionate":
      return t.tone_affectionate;
    case "curious":
      return t.tone_curious;
    case "distressed":
      return t.tone_distressed;
    case "frustrated":
      return t.tone_frustrated;
    case "neutral":
    default:
      return t.tone_neutral;
  }
}

export type MoodLabelType = "mood" | "responseStyle" | "userTone";

export function getMoodLabelByType(
  type: MoodLabelType,
  value: string,
  t: Translations,
): string {
  switch (type) {
    case "mood":
      return getMoodLabel(value as MemoryStats["mood"]["primary"], t);
    case "responseStyle":
      return getResponseStyleLabel(
        value as MemoryStats["mood"]["responseStyle"],
        t,
      );
    case "userTone":
      return getUserToneLabel(value as MemoryStats["mood"]["userTone"], t);
    default:
      return value;
  }
}

export function getHappinessLabel(happiness: number, t: Translations): string {
  if (happiness >= 80) return t.ecstatic;
  if (happiness >= 60) return t.happy;
  if (happiness >= 40) return t.content_mood;
  if (happiness >= 20) return t.neutral;
  return t.sad;
}

export function getBondLevelLabel(bondLevel: number, t: Translations): string {
  if (bondLevel >= 80) return t.best_friends;
  if (bondLevel >= 60) return t.close_friends;
  if (bondLevel >= 40) return t.friends;
  if (bondLevel >= 20) return t.acquaintances;
  return t.strangers;
}

export function formatRelationshipSummary(
  stats: MemoryStats,
  t: Translations,
): string {
  const bondLabel = getBondLevelLabel(stats.bondLevel, t);
  const happinessLabel = getHappinessLabel(stats.happiness, t);
  return `${t.relationship}: ${bondLabel}. ${t.bond_level}: ${stats.bondLevel}/100, ${t.happiness}: ${happinessLabel} (${stats.happiness}/100)`;
}

export function formatMoodSummary(stats: MemoryStats, t: Translations): string {
  const moodLabel = getMoodLabel(stats.mood.primary, t);
  const styleLabel = getResponseStyleLabel(stats.mood.responseStyle, t);
  const toneLabel = getUserToneLabel(stats.mood.userTone, t);

  return [
    `${t.current_mood}: ${moodLabel} (${stats.mood.intensity}/100)`,
    `${t.response_style}: ${styleLabel}`,
    `${t.user_tone}: ${toneLabel}`,
    `${t.social_battery}: ${stats.mood.socialBattery}/100`,
    stats.mood.summary,
  ].join(" | ");
}
