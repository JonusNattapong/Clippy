# Docs - Getting Started (English)

This guide walks you through setting up Clippy for the first time, including configuring AI providers and text-to-speech.

## Overview

Clippy is a desktop AI assistant that can connect to various LLM providers:

- **Cloud providers**: Gemini, OpenAI, Anthropic, OpenRouter (require API keys)
- **Local provider**: Ollama (runs locally, no API key needed)

It also includes a text-to-speech system powered by `edge-tts` (built into Windows/macOS/Linux) for voice responses.

## Prerequisites

- Windows 10/11, macOS, or Linux
- Node.js >= 18
- npm or pnpm
- For Ollama: [Ollama installed](https://ollama.ai) with at least one model pulled (e.g., `ollama pull llama3.2`)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci   # Installs exact versions from package-lock.json
```

### 2. Configure Environment Variables

Copy the example env file and edit it to add your API keys:

```bash
cp .env.example .env
```

Open `.env` in a text editor and set the keys for the providers you want to use:

```dotenv
# Required for cloud providers (leave blank if not using)
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# Optional: Tavily API key for web search (used by /search command)
TAVILY_API_KEY=your_tavily_key_here
```

**Provider-specific notes:**

- **Ollama**: No API key needed. Just ensure Ollama is running and a model is available.

  ```bash
  # Install Ollama from https://ollama.ai
  ollama pull llama3.2   # or any other model you prefer
  ```

- **OpenRouter**: Can be used to access many models via a single key. See https://openrouter.ai

- **Gemini**: Get a key from https://makersuite.google.com/app/apikey

- **OpenAI**: Get a key from https://platform.openai.com/api-keys

- **Anthropic**: Get a key from https://console.anthropic.com/

### 3. Text-to-Speech (TTS) Configuration

Clippy uses the system's built-in TTS via `edge-tts`, which works out-of-the-box on:

- **Windows**: Uses Microsoft Edge voices
- **macOS**: Uses built-in speech synthesis
- **Linux**: Uses `espeak` or similar (may require installing `espeak` or `ffmpeg` for some voices)

To change TTS voice or behavior:

1. Start Clippy (`npm run start`)
2. Open Settings (gear icon in the UI)
3. Navigate to the "TTS" or "Voice" section
4. Select your preferred voice, adjust speed/pitch, and test

> **Note**: If TTS doesn't work on Linux, ensure you have a TTS engine installed (e.g., `sudo apt install espeak` on Ubuntu).

### 4. Run the Application

```bash
npm run start
```

This launches Clippy in development mode. The app will appear on your desktop.

### 5. First-Time Setup in UI

When Clippy starts:

1. You may see a welcome prompt to choose your default AI provider.
2. You can change providers anytime via Settings → AI Provider.
3. Test the assistant by typing a message or using voice input (if microphone enabled).

## Using AI Providers

You can switch between providers at any time:

- Open Settings (⚙️)
- Select "AI Provider" from the sidebar
- Choose from the list of configured providers
- The change takes effect immediately for new conversations

## Verifying Your Setup

To check that everything is working:

1. Try a simple question: "Hello, Clippy!"
2. If you get a response, your AI provider is connected correctly.
3. Try a voice response: Click the speaker icon or ask Clippy to speak.
4. Try a web search: Type `/search latest AI news` (requires Tavily API key).

## Troubleshooting

- **"No AI provider configured"**: Check that at least one API key is set in `.env` or that Ollama is running.
- **TTS not speaking**: Verify your system's TTS works outside Clippy (test with system settings).
- **Web search returns "API key not configured"**: Set `TAVILY_API_KEY` in `.env`.
- **Ollama connection refused**: Ensure Ollama is running (`ollama serve`) and accessible at http://localhost:11434.

## Next Steps

- Explore built-in skills: Try `/sysinfo`, `/ps`, `/screenshot`
- Learn about desktop commands: See [Desktop Commands](#) in README
- Read about creating custom skills: [Skills System](./skills.md)
- Check out available templates: `templates/` folder for customizing Clippy's personality

## Related Documentation

- [`README.md`](../README.md) - Full feature list and requirements
- [`API.md`](../API.md) - Internal APIs and extension points
- [`skills.md`](./skills.md) - Detailed skills system documentation
- [`USAGE.md`](../USAGE.md) - Example usage and command reference
