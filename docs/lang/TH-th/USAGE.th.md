# วิธีใช้งาน (ไทย)

เริ่มต้น

- เปิดแอป (หลังรัน `npm run start` หรือจาก installer)
- ไปที่ Settings เพื่อใส่ API keys หรือเลือก provider

การสนทนาและความจำ

- เพิ่มความจำจากข้อความ:

```
[MEMORY_UPDATE: fact | ชื่อผู้ใช้คือ จอห์น | 10]
```

- อัปเดตสถิติ:

```
[STATS_UPDATE: { bond: +2, happiness: +5 }]
```

ตัวอย่าง IPC (renderer -> main)

```ts
// Language: typescript
window.api.send("chat:send", { text: "สวัสดี Clippy" });
window.api.receive("chat:reply", (reply) => console.log(reply));
```

การตั้งค่า model

- Settings > Model: เลือก Gemini/OpenAI/Anthropic/OpenRouter

การรักษาความปลอดภัย

- สำรอง `memories/` และ `config.json` ก่อนอัปเกรด
- อย่าเผย API keys ในที่สาธารณะ
