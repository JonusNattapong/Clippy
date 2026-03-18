import { MemoryCategory } from "../types/interfaces";

export type ExtractedMemoryCandidate = {
  content: string;
  category: MemoryCategory;
  importance: number;
  key: string;
  retention: "short_term" | "long_term";
  expiresAt?: number;
};

export function inferCategoriesFromQuery(query: string): Set<MemoryCategory> {
  const categories = new Set<MemoryCategory>();

  if (
    /\b(prefer|preference|like|love|hate|favorite|ชอบ|ไม่ชอบ|โปรด)\b/i.test(
      query,
    )
  ) {
    categories.add("preference");
  }

  if (
    /\b(friend|relationship|bond|close|care|รัก|สนิท|ความสัมพันธ์)\b/i.test(
      query,
    )
  ) {
    categories.add("relationship");
  }

  if (
    /\b(event|happened|yesterday|today|ล่าสุด|เมื่อวาน|วันนี้|เหตุการณ์)\b/i.test(
      query,
    )
  ) {
    categories.add("event");
  }

  if (
    /\b(name|fact|remember|about me)\b/i.test(query) ||
    /(ข้อมูล|ชื่อ|จำไว้|เรื่องของฉัน)/.test(query)
  ) {
    categories.add("fact");
  }

  return categories;
}

export function buildMemoryKey(
  category: MemoryCategory,
  rawContent: string,
): string {
  const normalized = rawContent
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = normalized
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        ![
          "the",
          "and",
          "that",
          "with",
          "เป็น",
          "และ",
          "ของ",
          "เรื่อง",
          "ครับ",
          "ค่ะ",
        ].includes(token),
    )
    .slice(0, 4);

  return `${category}.${tokens.join("_") || "general"}`;
}

export function extractMemoryCandidates(
  userMessage: string,
  assistantMessage: string,
  now: number = Date.now(),
): ExtractedMemoryCandidate[] {
  const text = userMessage.trim();
  const lowered = text.toLowerCase();
  const weekMs = 1000 * 60 * 60 * 24 * 7;
  const candidates: ExtractedMemoryCandidate[] = [];

  const pushCandidate = (
    content: string,
    category: MemoryCategory,
    importance: number,
    key: string,
    retention: "short_term" | "long_term",
    expiresAt?: number,
  ) => {
    const cleaned = content.trim().replace(/\s+/g, " ");
    if (!cleaned || cleaned.length < 6) {
      return;
    }

    candidates.push({
      content: cleaned,
      category,
      importance,
      key,
      retention,
      expiresAt,
    });
  };

  const preferenceMatch =
    text.match(
      /\b(?:i like|i love|i prefer|my favorite|i enjoy)\b[:\s-]*(.+)$/i,
    ) || text.match(/(?:ฉันชอบ|เราชอบ|ชอบมาก|ของโปรดคือ)\s*(.+)$/i);
  if (preferenceMatch?.[1]) {
    pushCandidate(
      `User preference: ${preferenceMatch[1]}`,
      "preference",
      7,
      buildMemoryKey("preference", preferenceMatch[1]),
      "long_term",
    );
  }

  const nameMatch =
    text.match(/\b(?:my name is|call me|i am)\b[:\s-]*(.+)$/i) ||
    text.match(/(?:ฉันชื่อ|ชื่อเราคือ|เรียกเราว่า)\s*(.+)$/i);
  if (nameMatch?.[1]) {
    pushCandidate(
      `User identity: ${nameMatch[1]}`,
      "fact",
      9,
      buildMemoryKey("fact", nameMatch[1]),
      "long_term",
    );
  }

  const eventHint =
    /\b(today|tomorrow|yesterday|this week|tonight|recently|later)\b/i.test(
      text,
    ) ||
    /(วันนี้|พรุ่งนี้|เมื่อวาน|คืนนี้|สัปดาห์นี้|ล่าสุด|เดี๋ยว)/.test(text);
  if (eventHint) {
    pushCandidate(
      `Recent context: ${text}`,
      "event",
      5,
      buildMemoryKey("event", text),
      "short_term",
      now + weekMs,
    );
  }

  const relationshipHint =
    /\b(friend|best friend|partner|family|mom|dad|girlfriend|boyfriend)\b/i.test(
      lowered,
    ) || /(เพื่อน|แฟน|ครอบครัว|แม่|พ่อ|คนรัก)/.test(text);
  if (relationshipHint) {
    pushCandidate(
      `Relationship context: ${text}`,
      "relationship",
      6,
      buildMemoryKey("relationship", text),
      eventHint ? "short_term" : "long_term",
      eventHint ? now + weekMs : undefined,
    );
  }

  const assistantReminderHint =
    /\bremember|noted|i'll remember|got it\b/i.test(assistantMessage) ||
    /(จะจำไว้|จำไว้แล้ว|รับทราบ|เข้าใจแล้ว)/.test(assistantMessage);
  if (
    assistantReminderHint &&
    candidates.length === 0 &&
    text.length >= 12 &&
    text.length <= 180
  ) {
    pushCandidate(
      `Conversation note: ${text}`,
      eventHint ? "event" : "fact",
      eventHint ? 4 : 6,
      buildMemoryKey(eventHint ? "event" : "fact", text),
      eventHint ? "short_term" : "long_term",
      eventHint ? now + weekMs : undefined,
    );
  }

  return candidates;
}
