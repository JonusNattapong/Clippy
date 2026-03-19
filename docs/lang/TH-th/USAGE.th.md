# วิธีใช้งาน (ไทย)

เริ่มต้น

- เปิดแอป (หลังรัน `npm run start` หรือจาก installer)
- ไปที่ Settings เพื่อใส่ API keys หรือเลือก provider

## การเลือก AI Provider

### Cloud Providers (Gemini, OpenAI, Anthropic, OpenRouter)
1. ไปที่ Settings > AI Provider
2. เลือก provider ที่ต้องการ
3. ใส่ API key
4. เลือกโมเดลจาก dropdown

### Ollama (Local)
1. ติดตั้ง Ollama และดึงโมเดล (ดู INSTALL.md)
2. ไปที่ Settings > AI Provider
3. เลือก "Ollama"
4. เลือกโมเดลจากรายการ

### Local LLM (node-llama-cpp) - ใหม่!
1. ไปที่ Settings > AI Provider
2. เลือก "Local LLM (GGUF)"
3. เลือกโมเดลจากรายการแนะนำ:
   - **Llama 3.2 3B** (2.0 GB) - เร็ว เหมาะสำหรับแชททั่วไป
   - **Llama 3.1 8B** (4.7 GB) - สมดุลระหว่างคุณภาพและความเร็ว
   - **Qwen 2.5 7B** (4.4 GB) - ดีสำหรับภาษาไทย
   - **Gemma 2 9B** (5.4 GB) - คุณภาพสูงจาก Google
   - **Phi-3.5 Mini** (2.2 GB) - เล็กแต่ความสามารถสูง
4. คลิก "Download" เพื่อดาวน์โหลดโมเดล
5. เริ่มแชทได้ทันที - ไม่ต้องใช้อินเทอร์เน็ต!

**หมายเหตุ:** โมเดลจะถูกเก็บไว้ในเครื่องและทำงานแบบ offline ได้ 100%

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

- Settings > Model: เลือก Gemini/OpenAI/Anthropic/OpenRouter/Ollama/Local LLM

การรักษาความปลอดภัย

- สำรอง `memories/` และ `config.json` ก่อนอัปเกรด
- อย่าเผย API keys ในที่สาธารณะ
