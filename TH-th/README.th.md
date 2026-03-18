# Clippy

> [English](../README.md) | ไทย

Clippy คือการนำเพื่อนเก่าที่คุ้นเคยในยุค 90 กลับมามีชีวิตอีกครั้งในรูปแบบของ "เพื่อนซี้ AI" ที่ฉลาดและเข้าใจหัวอกคุณมากกว่าเดิม ไม่ใช่แค่หน้าต่างแชต แต่เป็นมิตรภาพที่สร้างขึ้นจากความทรงจำและการเชื่อมต่อทางอารมณ์

---

## แนวคิดหลัก

เราเชื่อว่า AI ไม่ควรเป็นแค่กระดานโต้ตอบข้อความที่ตอบแล้วจบไป แต่ควรเป็น "เพื่อนคุย" ที่โตไปพร้อมกับคุณ

### ความจำระยะยาว

Clippy ไม่ได้จดจำแค่บริบทการสนทนาปัจจุบัน แต่ยังเรียนรู้ที่จะจดจำ:

- **ข้อมูลส่วนตัว:** เรื่องราวที่คุณเคยเล่า ความชอบ และไลฟ์สไตล์
- **รูปแบบการใช้งาน:** จดจำว่าคุณชอบให้ตอบแบบสั้นกระชับหรือเน้นรายละเอียด
- **ความชอบส่วนบุคคล:** เพื่อปรับแต่งการตอบสนองให้ตรงใจคุณทุกครั้งที่กลับมาคุย

### การตอบสนองทางอารมณ์

เพื่อให้การคุยกับ AI รู้สึกเป็นธรรมชาติและเป็นมิตร:

- **ฟังและเข้าใจ:** Clippy ไม่ได้มองหาแค่คำค้น แต่พยายามเข้าใจอารมณ์เบื้องหลังข้อความของคุณ
- **มีอารมณ์ร่วม:** ตอบสนองด้วยความเห็นอกเห็นใจหรือร่วมยินดีไปกับคุณ เพื่อสร้างความไว้วางใจที่แท้จริง

---

## คุณสมบัติ

- **ประสบการณ์ส่วนตัว:** ยิ่งคุย ยิ่งรู้ใจ ระบบจะปรับตัวตามสไตล์ที่คุณชอบ
- **ความเป็นส่วนตัว:** ความทรงจำ การตั้งค่า และบริบทส่วนตัวถูกจัดเก็บไว้ในเครื่องของคุณ คุณเป็นผู้ควบคุมว่าจะเชื่อมต่อ AI provider ใด
- **หน้าตา Windows 98:** ความคลาสสิกยุค 90 ที่มาพร้อมสมอง AI สมัยใหม่
- **API-First:** เชื่อมต่อโมเดลสมัยใหม่ผ่าน API เพื่อตอบไว คุณภาพดี และเริ่มใช้งานได้ทันทีโดยไม่ต้องดาวน์โหลดโมเดลหลาย GB
- **รองรับหลาย Provider:** เลือกใช้ Google Gemini, OpenAI, Anthropic หรือ OpenRouter ได้ตามงบประมาณและความชอบ
- **ระบบ Skills/Plugins:** สถาปัตยกรรมแบบโมดูลาร์สำหรับขยายความสามารถ
- **คำสั่งเดสก์ท็อป:** รันคำสั่ง PowerShell, ค้นหาไฟล์, ถ่ายภาพหน้าจอ
- **ค้นหาเว็บ:** ค้นหาข้อมูลบนเว็บผ่าน Tavily API
- **Text-to-Speech:** ตอบเป็นเสียงด้วย edge-tts
- **ระบบความจำและความสัมพันธ์:** ระดับ Bond (0-100) และ Happiness (0-100) ที่เติบโตไปตามการใช้งาน
- **รองรับหลายภาษา:** ภาษาอังกฤษและไทย

---

## โครงสร้างโปรเจกต์

```
src/
├── main/                    # Electron main process
│   ├── skills/              # ระบบ Skills/Plugins
│   │   ├── index.ts         # Public API exports
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── registry.ts      # Skill registry & loader
│   │   ├── system.skill.ts  # System skill
│   │   └── web.skill.ts     # Web skill
│   ├── chat-provider.ts     # AI chat providers
│   ├── desktop-tools.ts     # คำสั่งเดสก์ท็อป
│   ├── web-tools.ts         # เครื่องมือค้นหาเว็บ
│   ├── memory.ts            # ระบบความจำ
│   ├── tts.ts               # Text-to-speech
│   └── windows.ts           # จัดการหน้าต่าง
├── renderer/                # React UI (frontend)
├── helpers/                 # Shared utilities
├── types/                   # TypeScript definitions
└── ipc-messages.ts          # IPC communication
```

---

## เทคโนโลยี

- **Electron** - Desktop application framework
- **React** - UI components
- **TypeScript** - Type safety
- **API-First** - Gemini, OpenAI, Anthropic, OpenRouter

---

## ขอบคุณ

Clippy คือความรักและคำขอบคุณที่มีต่อ **Clippy** ผู้ช่วยระดับตำนานจาก Microsoft Office 1997 เราต่อยอดการออกแบบของ Kevan Atteberry (ผู้สร้าง Clippy) ให้กลายเป็นเพื่อนที่คุยเก่งและเข้าใจมนุษย์ในโลกยุคใหม่

_หมายเหตุ: แอปนี้เป็นผลงานศิลปะ/ล้อเลียนทางซอฟต์แวร์ ไม่มีส่วนเกี่ยวข้องกับ Microsoft_

---

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- Windows 10/11, macOS หรือ Linux
- Node.js 18+
- npm หรือ pnpm
- สำหรับ Ollama: ติดตั้ง Ollama (https://ollama.ai) และดาวน์โหลดโมเดล (เช่น `ollama pull llama3.2`)

### ติดตั้ง

```bash
git clone https://github.com/JonusNattapong/Clippy
cd Clippy
npm ci
cp .env.example .env
# แก้ไข .env เพื่อเพิ่ม API keys
npm run start
```

### สคริปต์สำคัญ

| สคริปต์           | คำอธิบาย                     |
| ----------------- | ---------------------------- |
| `npm run start`   | เริ่มโหมดพัฒนา               |
| `npm run build`   | Build สำหรับ production      |
| `npm run lint`    | จัดรูปแบบโค้ดด้วย Prettier   |
| `npm test`        | รันชุดทดสอบ                  |
| `npm run package` | แพ็คเกจแอปโดยไม่มีตัวติดตั้ง |
| `npm run make`    | สร้างตัวติดตั้ง              |

---

## ระบบ Skills

Clippy มีระบบ Skills/Plugins แบบโมดูลาร์สำหรับขยายความสามารถ:

### Built-in Skills

| Skill    | Actions                                               |
| -------- | ----------------------------------------------------- |
| `system` | `get_info`, `list_processes`, `get_env`, `get_uptime` |
| `web`    | `search`, `fetch_url`                                 |

### สร้าง Skill เอง

```typescript
// skills/my-skill/index.js
module.exports.default = function createMySkill() {
  return {
    meta: {
      id: "my-skill",
      name: "My Skill",
      version: "1.0.0",
      description: "คำอธิบาย skill",
    },
    actions: {
      my_action: {
        meta: { name: "my_action", description: "..." },
        execute: async (args) => {
          return { success: true, output: "Done" };
        },
      },
    },
  };
};
```

วาง custom skills ใน `%APPDATA%\Clippy\skills\` (Windows) หรือ `~/Library/Application Support/Clippy/skills/` (macOS)

ดูเอกสารฉบับเต็มที่ [`docs/skills.md`](../docs/skills.md)

---

## ตำแหน่งข้อมูลผู้ใช้

| แพลตฟอร์ม | ตำแหน่ง                                 |
| --------- | --------------------------------------- |
| Windows   | `%APPDATA%\Clippy\`                     |
| macOS     | `~/Library/Application Support/Clippy/` |

### ไฟล์ที่จัดเก็บ

| ไฟล์                   | คำอธิบาย                  |
| ---------------------- | ------------------------- |
| `config.json`          | การตั้งค่าแอป             |
| `memories/memory.json` | ความจำระยะยาว             |
| `chats/`               | ประวัติการสนทนา           |
| `identity.json`        | การตั้งค่าตัวตนของ Clippy |
| `user.json`            | โปรไฟล์ผู้ใช้             |
| `skills/`              | Custom skills             |

---

## คำสั่งเดสก์ท็อป

| คำสั่ง            | คำอธิบาย             |
| ----------------- | -------------------- |
| `/run <cmd>`      | รันคำสั่ง PowerShell |
| `/ls [path]`      | แสดงเนื้อหาไดเรกทอรี |
| `/read <file>`    | อ่านเนื้อหาไฟล์      |
| `/search <query>` | ค้นหาไฟล์            |
| `/sysinfo`        | ข้อมูลระบบ           |
| `/ps [limit]`     | แสดง process         |
| `/screenshot`     | ถ่ายภาพหน้าจอ        |
| `/clipboard`      | อ่านคลิปบอร์ด        |

---

## คำสั่งเว็บ

| คำสั่ง            | คำอธิบาย                          |
| ----------------- | --------------------------------- |
| `/search <query>` | ค้นหาเว็บ (ต้องมี Tavily API key) |
| `/fetch <url>`    | ดึงเนื้อหาเว็บเพจ                 |

---

## เอกสาร

- [`INSTALL.md`](INSTALL.th.md) - คู่มือติดตั้ง
- [`USAGE.md`](USAGE.th.md) - ตัวอย่างการใช้งาน
- [`API.md`](API.th.md) - เอกสาร API
- [`docs/skills.md`](../docs/skills.md) - เอกสารระบบ Skills
- [`README.md`](../README.md) - English version

---

## ระบบความจำ

Clippy เรียนรู้เกี่ยวกับคุณผ่านการสนทนา เมื่อคุณแชร์สิ่งสำคัญ AI สามารถสร้างความจำได้ด้วย tag พิเศษ:

```
[MEMORY_UPDATE: fact | ชื่อผู้ใช้คือ จอห์น | 10]
[MEMORY_UPDATE: preference | ชอบกินอาหารเผ็ด | 7]
```

อัปเดตสถิติความสัมพันธ์:

```
[STATS_UPDATE: { bond: +2, happiness: +5 }]
```

ดูและจัดการความจำได้ใน Settings > Memory

---

## สัญญาอนุญาต

แบบ MIT License (ดูรายละเอียดที่ [LICENSE.md](../LICENSE.md))
