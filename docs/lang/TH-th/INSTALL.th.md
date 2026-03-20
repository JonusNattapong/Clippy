# ติดตั้ง / การตั้งค่า (ไทย)

ข้อกำหนด

- Node.js 18+
- npm หรือ pnpm
- Git

ติดตั้ง

```bash
git clone https://github.com/yourusername/Clippy.git
cd Clippy
npm ci
cp .env.example .env
# แก้ .env เพื่อใส่ API keys สำหรับ cloud providers
# สำหรับ Local LLM (node-llama-cpp) ไม่ต้องใส่ API key
```

รันในโหมดพัฒนา

```bash
npm run start
```

Build สำหรับปล่อยจริง

```bash
npm run build
npm run make
```

การทดสอบ

```bash
npm test
```

## การตั้งค่า AI Provider

### Cloud Providers (Gemini, OpenAI, Anthropic, OpenRouter)

เพิ่ม API keys ใน `.env`:

```
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```

### Ollama (Local)

1. ติดตั้ง Ollama จาก https://ollama.ai
2. ดึงโมเดล: `ollama pull llama3.2`
3. เลือก "Ollama" เป็น provider ใน Settings

### Local LLM (node-llama-cpp) - ใหม่!

1. ไม่ต้องติดตั้งซอฟต์แวร์เพิ่ม - ใช้ได้ทันที
2. เลือก "Local LLM (GGUF)" เป็น provider ใน Settings
3. เลือกโมเดลแล้วคลิก Download
4. โมเดลจะถูกบันทึกที่:
   - Windows: `%APPDATA%\Clippy\models\`
   - macOS: `~/Library/Application Support/Clippy/models/`

## ปัญหาที่พบบ่อย

- ลบ `node_modules` แล้วรัน `npm ci` หากติดปัญหา dependency
- ตรวจสอบค่า API keys ใน `.env` หาก provider ไม่ตอบ
- สำหรับ Local LLM ตรวจสอบว่ามีพื้นที่ว่างเพียงพอสำหรับไฟล์โมเดล (2-5 GB)
