# API / การเชื่อมต่อ (ไทย)

ภาพรวม

- แอปใช้ช่องทาง IPC ระหว่าง renderer และ main สำหรับการส่งคำขอแชทและการตั้งค่า

ช่องทาง IPC

- `chat:send`
  - payload: { text: string, metadata?: any }
- `chat:reply`
  - payload: { id: string, text: string, source: 'provider' | 'memory' }
- `settings:update`
  - payload: { key: string, value: any }

ตัวอย่างการเรียก provider (แนวคิด)

```ts
// Language: typescript
import { callProvider } from "./main/chat-provider";
const response = await callProvider({ provider: "openai", prompt: "Hello" });
console.log(response.text);
```

ความปลอดภัย

- เก็บ API keys ใน `.env` หรือ storage ที่เข้ารหัส
- อย่าส่ง API keys ไปยัง renderer โดยตรง

ดูโค้ดเพิ่มเติมที่: [`src/main/chat-provider.ts`](src/main/chat-provider.ts:1)
