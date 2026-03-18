import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMemoryKey,
  extractMemoryCandidates,
  inferCategoriesFromQuery,
} from "../src/main/memory-helpers";

test("inferCategoriesFromQuery detects preference queries", () => {
  const categories = inferCategoriesFromQuery("I like jazz and spicy food");

  assert.equal(categories.has("preference"), true);
});

test("inferCategoriesFromQuery detects relationship and event queries", () => {
  const categories = inferCategoriesFromQuery("my friend visited me yesterday");

  assert.equal(categories.has("relationship"), true);
  assert.equal(categories.has("event"), true);
});

test("inferCategoriesFromQuery detects fact queries in Thai", () => {
  const categories = inferCategoriesFromQuery("ชื่อของฉันคือ นนท์");

  assert.equal(categories.has("fact"), true);
});

test("buildMemoryKey strips punctuation and stop words", () => {
  const key = buildMemoryKey("fact", "My name is Nontawat, the developer!");

  assert.equal(key, "fact.name_nontawat_developer");
});

test("buildMemoryKey falls back to general when no tokens remain", () => {
  const key = buildMemoryKey("event", "the and of");

  assert.equal(key, "event.general");
});

test("extractMemoryCandidates captures preference memories", () => {
  const candidates = extractMemoryCandidates(
    "I love mango sticky rice",
    "Got it",
    1000,
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].category, "preference");
  assert.equal(candidates[0].retention, "long_term");
  assert.match(candidates[0].content, /mango sticky rice/i);
});

test("extractMemoryCandidates captures identity memories", () => {
  const candidates = extractMemoryCandidates(
    "My name is Nontawat",
    "Nice to meet you",
    1000,
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].category, "fact");
  assert.equal(candidates[0].importance, 9);
  assert.match(candidates[0].content, /Nontawat/);
});

test("extractMemoryCandidates captures short-term event memories", () => {
  const candidates = extractMemoryCandidates(
    "Today I have a dentist appointment",
    "Understood",
    1000,
  );

  assert.equal(
    candidates.some((candidate) => candidate.category === "event"),
    true,
  );
  const eventCandidate = candidates.find(
    (candidate) => candidate.category === "event",
  );
  assert.equal(eventCandidate?.retention, "short_term");
  assert.equal(eventCandidate?.expiresAt, 1000 + 1000 * 60 * 60 * 24 * 7);
});

test("extractMemoryCandidates captures relationship context", () => {
  const candidates = extractMemoryCandidates(
    "My girlfriend loves hiking",
    "Okay",
    1000,
  );

  assert.equal(
    candidates.some((candidate) => candidate.category === "relationship"),
    true,
  );
});

test("extractMemoryCandidates creates fallback conversation note when assistant confirms", () => {
  const candidates = extractMemoryCandidates(
    "Please remember that my office is on the 12th floor",
    "I'll remember that",
    1000,
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].category, "fact");
  assert.match(candidates[0].content, /Conversation note:/);
});

test("extractMemoryCandidates avoids fallback when stronger candidates exist", () => {
  const candidates = extractMemoryCandidates(
    "I love ramen",
    "I'll remember that",
    1000,
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].category, "preference");
});

test("extractMemoryCandidates supports Thai preference patterns", () => {
  const candidates = extractMemoryCandidates(
    "ฉันชอบชาเขียว",
    "เข้าใจแล้ว",
    1000,
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].category, "preference");
});

test("extractMemoryCandidates ignores very short content", () => {
  const candidates = extractMemoryCandidates("Hi", "noted", 1000);

  assert.equal(candidates.length, 0);
});
