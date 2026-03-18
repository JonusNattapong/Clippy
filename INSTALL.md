# INSTALL / SETUP (English)

Requirements

- Node.js 18+
- npm or pnpm
- Git
- (macOS) Xcode command line tools for building bundles

Installation

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci
cp .env.example .env
# Edit .env to add required API keys
```

Run (development)

```bash
npm run start
```

Production build

```bash
npm run build
npm run make  # create installers via electron-forge
```

Tests

```bash
npm test
```

Troubleshooting

- Remove node_modules and run `npm ci` if dependency errors occur.
- Verify API keys in `.env` if provider calls fail.
