# INSTALL / SETUP (English)

Requirements

- Node.js 20+ (Recommended: Node.js 22.12.0+)
- npm or pnpm
- Git
- (macOS) Xcode command line tools for building bundles

Installation

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci
cp .env.example .env
# Edit .env to add required API keys for cloud providers
# For Local LLM (node-llama-cpp), no API key is needed
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

## AI Provider Setup

### Cloud Providers (Gemini, OpenAI, Anthropic, OpenRouter)

Add your API keys to `.env`:

```
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
KILO_API_KEY=your_key_here
```

### Web Search (Tavily)

For web search functionality (`/search`, `/google` commands):

```
TAVILY_API_KEY=your_key_here
```

Get your free API key at https://tavily.com

### Ollama (Local)

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Select "Ollama" as provider in Settings

### Local LLM (node-llama-cpp)

1. No additional software needed - works out of the box
2. Select "Local LLM (GGUF)" as provider in Settings
3. Choose a model and click Download
4. Models are saved to:
   - Windows: `%APPDATA%\Clippy\models\`
   - macOS: `~/Library/Application Support/Clippy/models/`

## Troubleshooting

- Remove node_modules and run `npm ci` if dependency errors occur.
- Verify API keys in `.env` if provider calls fail.
- For Local LLM, ensure you have enough disk space for model files (2-5 GB).
