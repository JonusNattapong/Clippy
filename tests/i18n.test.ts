import test from "node:test";
import assert from "node:assert/strict";

import { getTranslations } from "../src/renderer/i18n";

test("english translations include first-run and backup labels", () => {
  const t = getTranslations("en");

  assert.equal(t.first_run_title, "Set Up Clippy");
  assert.equal(t.export_backup, "Export Backup");
  assert.equal(t.tts_title, "Text-to-Speech");
});

test("thai translations include first-run and backup labels", () => {
  const t = getTranslations("th");

  assert.equal(t.first_run_title, "เริ่มตั้งค่า Clippy");
  assert.equal(t.import_backup, "นำเข้าแบ็กอัป");
  assert.equal(t.tts_title, "ข้อความเป็นเสียงพูด");
});

test("getTranslations falls back to english for unknown language", () => {
  const t = getTranslations("unknown" as never);

  assert.equal(t.settings, "Settings");
});
