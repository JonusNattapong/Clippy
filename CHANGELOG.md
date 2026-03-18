# CHANGELOG

ทุกรายการจะใช้รูปแบบ Keep a Changelog

## [Unreleased]

- งานที่ยังไม่ถูกปล่อย (Unreleased)

## [0.5.1] - 2026-03-18

- เพิ่มระบบสร้างภาพหน้าปกอัตโนมัติสำหรับ GitHub Release

  - เพิ่มสคริปต์ `scripts/generate-release-cover.js` ที่เรียกไปยัง provider (OpenRouter/หรือ endpoint ที่กำหนด)
  - รองรับตัวแปรสภาพแวดล้อม `COVER_PROMPT`, `COVER_SIZE`, `COVER_MODEL` เพื่อปรับ prompt/ขนาด/โมเดล
  - ปรับ workflow release ให้ใช้ `github.ref_name` และรันสคริปต์เพียงเท่าที่จำเป็นก่อนอัพโหลด artifact

- ปรับปรุงระบบ provider และการสตรีมข้อความ

  - รองรับผู้ให้บริการ: Gemini, OpenAI, Anthropic, OpenRouter และ `ollama` (local)
  - `ollama` ถูกจัดการเป็น provider ท้องถิ่น (ไม่จำเป็นต้องมี API key) และมี endpoint ตรวจสอบสถานะ (CHECK_OLLAMA)

- Skills / Plugin system

  - เรียกใช้งาน registry ของ skills ที่สตาร์ทแอป (`initSkillRegistry()` ใน `src/main/main.ts`) เพื่อให้ skills ถูกค้นหา/โหลดตอนเริ่มต้น
  - เพิ่ม IPC handler `CHECK_SKILL_STATUSES` และ `clippy.checkSkillStatuses()` ใน preload เพื่อให้ UI ดึงสถานะ skills ได้
  - เพิ่ม UI ใน Settings (`src/renderer/components/SettingsModel.tsx`) เพื่อแสดงตาราง skills พร้อมฟีเจอร์ค้นหาและตัวกรองสถานะ

- UI / Docs

  - ปรับให้หน้าเอกสารภายในแอปเปิดเป็น in-page windows (iframe) แทน popup
  - อัปเดตหลายหน้าเอกสารเพื่อใช้เส้นทาง `docs/page/*`

- TTS / Voice

  - ยืนยันลำดับการทำงานของเสียง: รับเสียง -> ถอดเป็นข้อความ -> ตอบเป็นข้อความของผู้ช่วย -> เล่น TTS เมื่อถูกต้อง

- IPC / Preload

  - ขยาย surface ของ preload (`src/renderer/preload.ts`) เพื่อเผย `clippy.checkOllama()` และ `clippy.checkSkillStatuses()` ให้ renderer ใช้งาน

- เบ็ดเตล็ด
  - ปรับปรุงตัวอย่างการตั้งค่าและ README บางส่วนให้สะท้อนการเปลี่ยนแปลง
  - เพิ่มการตรวจสอบและการจัดการ key สำหรับ provider (ไม่บังคับให้ `ollama` มี key)

## [0.1.0] - 2026-03-18

- เบต้าเริ่มต้น: โครงสร้างโปรเจ็ค, UI พื้นฐาน, ระบบความจำ, การเชื่อมต่อ provider (placeholder)
