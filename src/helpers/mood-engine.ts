import {
  MemoryStats,
  MoodState,
  ClippyMood,
  ClippyResponseStyle,
  UserTone,
} from "../types/interfaces";

export const DEFAULT_MOOD_STATE: MoodState = {
  primary: "calm",
  intensity: 42,
  socialBattery: 72,
  responseStyle: "balanced",
  userTone: "neutral",
  summary: "Clippy feels calm and ready to chat.",
  updatedAt: 0,
};

type MoodSignal = {
  tone: UserTone;
  positivity: number;
  affection: number;
  curiosity: number;
  distress: number;
  frustration: number;
  excitement: number;
};

export function buildMoodState(
  stats: Pick<
    MemoryStats,
    "bondLevel" | "happiness" | "totalInteractions" | "lastInteractionAt"
  >,
  userMessage: string,
  assistantMessage: string,
): MoodState {
  const signal = detectMoodSignal(userMessage, assistantMessage);
  const primary = pickPrimaryMood(stats, signal);
  const intensity = clamp(
    34 +
      signal.excitement * 9 +
      signal.distress * 10 +
      signal.affection * 6 +
      signal.frustration * 8 +
      Math.abs(stats.happiness - 50) * 0.35,
    20,
    100,
  );
  const socialBattery = clamp(
    55 +
      stats.happiness * 0.25 +
      stats.bondLevel * 0.18 +
      signal.affection * 5 -
      signal.distress * 4 -
      signal.frustration * 5,
    10,
    100,
  );
  const responseStyle = pickResponseStyle(stats, signal);

  return {
    primary,
    intensity,
    socialBattery,
    responseStyle,
    userTone: signal.tone,
    summary: buildMoodSummary(primary, responseStyle, signal.tone),
    updatedAt: Date.now(),
  };
}

function detectMoodSignal(
  userMessage: string,
  assistantMessage: string,
): MoodSignal {
  const combined = `${userMessage} ${assistantMessage}`.toLowerCase();
  const text = normalize(combined);

  const positivity = countMatches(text, [
    "thanks",
    "thank you",
    "great",
    "awesome",
    "good",
    "yay",
    "nice",
    "ดี",
    "เยี่ยม",
    "ขอบคุณ",
    "น่ารัก",
    "เก่ง",
    "สุดยอด",
  ]);
  const affection = countMatches(text, [
    "love",
    "miss you",
    "cute",
    "bestie",
    "hug",
    "รัก",
    "คิดถึง",
    "กอด",
    "น่ารัก",
    "เพื่อน",
    "ซี้",
  ]);
  const curiosity = countMatches(text, [
    "?",
    "how",
    "why",
    "what",
    "teach me",
    "explain",
    "ช่วยอธิบาย",
    "ทำไม",
    "ยังไง",
    "อะไร",
    "อธิบาย",
  ]);
  const distress = countMatches(text, [
    "sad",
    "tired",
    "anxious",
    "stress",
    "upset",
    "cry",
    "bad day",
    "เศร้า",
    "เครียด",
    "เหนื่อย",
    "ท้อ",
    "แย่",
    "ร้องไห้",
    "ไม่ไหว",
  ]);
  const frustration = countMatches(text, [
    "angry",
    "annoying",
    "frustrated",
    "broken",
    "doesn't work",
    "problem",
    "error",
    "หงุดหงิด",
    "โมโห",
    "พัง",
    "ใช้ไม่ได้",
    "เออเรอร์",
    "ปัญหา",
  ]);
  const excitement = countMatches(text, [
    "omg",
    "wow",
    "excited",
    "celebrate",
    "amazing",
    "woo",
    "ตื่นเต้น",
    "ว้าว",
    "ดีใจ",
    "ฉลอง",
    "สุดยอด",
  ]);

  const tone = resolveUserTone({
    positivity,
    affection,
    curiosity,
    distress,
    frustration,
    excitement,
  });

  return {
    tone,
    positivity,
    affection,
    curiosity,
    distress,
    frustration,
    excitement,
  };
}

function resolveUserTone(signal: Omit<MoodSignal, "tone">): UserTone {
  if (signal.distress >= 2) {
    return "distressed";
  }
  if (signal.frustration >= 2) {
    return "frustrated";
  }
  if (signal.affection >= 2) {
    return "affectionate";
  }
  if (signal.curiosity >= 2) {
    return "curious";
  }
  if (signal.positivity + signal.excitement >= 2) {
    return "positive";
  }

  return "neutral";
}

function pickPrimaryMood(
  stats: Pick<MemoryStats, "bondLevel" | "happiness">,
  signal: MoodSignal,
): ClippyMood {
  if (signal.distress >= 2) {
    return "supportive";
  }
  if (signal.frustration >= 2) {
    return "concerned";
  }
  if (
    signal.excitement >= 2 ||
    (stats.happiness >= 75 && signal.positivity >= 1)
  ) {
    return "excited";
  }
  if (
    signal.affection >= 2 ||
    (stats.bondLevel >= 70 && stats.happiness >= 60)
  ) {
    return "playful";
  }
  if (signal.curiosity >= 2) {
    return "focused";
  }

  return stats.happiness < 35 ? "concerned" : "calm";
}

function pickResponseStyle(
  stats: Pick<MemoryStats, "bondLevel" | "happiness">,
  signal: MoodSignal,
): ClippyResponseStyle {
  if (signal.distress >= 2 || signal.frustration >= 2) {
    return "gentle";
  }
  if (
    signal.excitement >= 2 ||
    (stats.happiness >= 80 && stats.bondLevel >= 60)
  ) {
    return "energetic";
  }

  return "balanced";
}

function buildMoodSummary(
  primary: ClippyMood,
  responseStyle: ClippyResponseStyle,
  userTone: UserTone,
) {
  const moodText: Record<ClippyMood, string> = {
    calm: "calm and steady",
    playful: "playful and warm",
    supportive: "supportive and extra caring",
    excited: "excited and celebratory",
    focused: "focused and attentive",
    concerned: "concerned and protective",
  };
  const styleText: Record<ClippyResponseStyle, string> = {
    gentle: "with a gentle touch",
    balanced: "in a balanced way",
    energetic: "with upbeat energy",
  };
  const toneText: Record<UserTone, string> = {
    neutral: "neutral",
    positive: "positive",
    affectionate: "affectionate",
    curious: "curious",
    distressed: "distressed",
    frustrated: "frustrated",
  };

  return `Clippy feels ${moodText[primary]} and is replying ${styleText[responseStyle]} because the user seems ${toneText[userTone]}.`;
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function countMatches(text: string, patterns: string[]) {
  return patterns.reduce((score, pattern) => {
    if (pattern === "?") {
      return score + (text.includes("?") ? 1 : 0);
    }

    return score + (text.includes(pattern) ? 1 : 0);
  }, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
