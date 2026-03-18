import test from "node:test";
import assert from "node:assert/strict";

import {
  containsSensitiveNotificationContent,
  isWithinQuietHours,
  normalizeTelegramChatIds,
  truncateTelegramMessage,
} from "../src/main/notification-guards";

test("normalizeTelegramChatIds splits comma and space separated lists", () => {
  assert.deepEqual(normalizeTelegramChatIds("-100123, 456 789"), [
    "-100123",
    "456",
    "789",
  ]);
});

test("containsSensitiveNotificationContent detects likely secrets", () => {
  assert.equal(
    containsSensitiveNotificationContent("api_key=sk-test-secret-value"),
    true,
  );
  assert.equal(
    containsSensitiveNotificationContent("Your build completed successfully."),
    false,
  );
});

test("isWithinQuietHours supports overnight quiet windows", () => {
  assert.equal(
    isWithinQuietHours(new Date("2026-03-18T23:15:00"), "22:00", "07:00"),
    true,
  );
  assert.equal(
    isWithinQuietHours(new Date("2026-03-18T12:15:00"), "22:00", "07:00"),
    false,
  );
});

test("truncateTelegramMessage shortens long content", () => {
  const truncated = truncateTelegramMessage("x".repeat(20), 10);

  assert.equal(truncated.length, 10);
  assert.equal(truncated.endsWith("…"), true);
});
