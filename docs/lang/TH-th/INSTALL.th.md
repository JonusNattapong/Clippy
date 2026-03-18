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
# แก้ .env เพื่อใส่ API keys
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

ปัญหาที่พบบ่อย

- ลบ `node_modules` แล้วรัน `npm ci` หากติดปัญหา dependency
- ตรวจสอบค่า API keys ใน `.env` หาก provider ไม่ตอบ
