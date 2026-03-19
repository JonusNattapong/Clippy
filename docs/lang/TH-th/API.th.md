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

## AI Providers

### Providers ที่รองรับ

| Provider | ประเภท | ต้องใช้ API Key | หมายเหตุ |
|----------|--------|----------------|-----------|
| Gemini | Cloud | ใช่ | AI ของ Google |
| OpenAI | Cloud | ใช่ | โมเดล GPT |
| Anthropic | Cloud | ใช่ | โมเดล Claude |
| OpenRouter | Cloud | ใช่ | หลายโมเดล |
| Ollama | Local | ไม่ | ต้องติดตั้ง Ollama |
| **Local LLM** | Local | ไม่ | **node-llama-cpp - ใหม่!** |

### Local LLM API (node-llama-cpp)

Local LLM provider ใช้ `node-llama-cpp` ในการรันโมเดล GGUF โดยตรงในแอป

**ฟังก์ชัน:**
```typescript
// โหลดโมเดล
await loadModel(modelName: string): Promise<void>

// ยกเลิกโมเดลปัจจุบัน
await unloadModel(): Promise<void>

// ตรวจสอบว่าโมเดลโหลดอยู่หรือไม่
isModelLoaded(): boolean

// ชื่อโมเดลปัจจุบัน
getCurrentModelName(): string

// สร้างข้อความ
for await (const chunk of generateText(prompt, options)) {
  console.log(chunk);
}

// แสดงรายการโมเดลที่มีในเครื่อง
listLocalModels(): LocalModelInfo[]

// แสดงโมเดลที่แนะนำ
getRecommendedModels(): Array<{name, filename, url, description, size}>

// ดาวน์โหลดโมเดล
await downloadModel(url, filename, onProgress): Promise<string>
```

**ตัวอย่าง:**
```typescript
import { loadModel, generateText, isModelLoaded } from "./main/local-llm";

// โหลดโมเดล
if (!isModelLoaded()) {
  await loadModel("llama-3.2-3b-instruct");
}

// สร้างข้อความตอบกลับ
for await (const chunk of generateText("สวัสดี สบายดีไหม?")) {
  process.stdout.write(chunk);
}
```

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
- โมเดล Local LLM จะถูกเก็บใน user data directory และทำงานแบบ offline ได้

ดูโค้ดเพิ่มเติมที่: [`src/main/chat-provider.ts`](src/main/chat-provider.ts:1), [`src/main/local-llm.ts`](src/main/local-llm.ts:1)
