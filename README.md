# Clippy

> English | [Thai](README.th.md)

Clippy is a retro desktop AI companion built with Electron, React, and TypeScript. It blends a Windows 98-inspired interface with modern API-based AI providers, long-term memory, mood and relationship tracking, and customizable identity settings so the assistant feels more personal over time.

This project is inspired by the charm of 90s desktop assistants, but the experience here is centered on building an AI companion that can remember you, speak, search the web when configured, and adapt its tone and personality to fit your preferences.

---

## Core Vision

We do not think AI should feel like a disposable chat box that answers and forgets. Clippy is designed to feel more like a companion that grows with you through memory, preferences, and repeated interaction.

### Long-term Memory

Clippy does not stop at the current chat context. It can remember:

- **Personal Information:** Stories you've shared, preferences, and lifestyle
- **Relationship Context:** Bond level, happiness, and interaction history
- **Structured Memories:** Facts, preferences, events, and relationship notes

### Emotional Responses

To make conversations feel warmer and more natural:

- **Mood-Aware Behavior:** Tracks an internal mood state and response style
- **User Tone Awareness:** Adapts based on whether your tone feels neutral, curious, positive, distressed, or frustrated

---

## Features

- **Multi-Provider AI:** Choose between Google Gemini, OpenAI, Anthropic, and OpenRouter
- **Persistent Memory System:** Store and manage facts, preferences, events, and relationship memories locally
- **Relationship Stats:** Track bond level, happiness, total interactions, and last interaction time
- **Custom Identity:** Edit the assistant's name, vibe, emoji, and mission
- **User Profile:** Save user name, nickname, pronouns, timezone, communication style, tone, and response-length preferences
- **Text-to-Speech:** Built-in speech playback with Thai, English, Japanese, Korean, and Chinese voice options
- **Web Tools:** Optional web search and page fetching when a Tavily API key is configured
- **Bilingual UI:** Supports English and Thai
- **Theme Customization:** Includes classic, ocean, forest, sunset, midnight, and custom themes
- **First-Run Setup:** Onboarding flow for language, theme, and AI provider configuration
- **Privacy-Aware:** Memories, settings, and profile data are stored locally on your machine

## Non-Features

This is not trying to be a generic all-in-one AI dashboard or a benchmark-chasing chatbot shell. The goal is a personality-driven desktop companion with a nostalgic interface and a more human sense of continuity.

---

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI components
- **TypeScript** - Type safety
- **API-First AI** - Gemini, OpenAI, Anthropic, OpenRouter
- **electron-store** - Local settings and app data
- **node-edge-tts** - Speech synthesis

---

## Acknowledgements

Clippy draws inspiration from classic desktop assistants and the visual language of late-90s software. Thanks to the open-source tools and creators that make this project possible.

Special thanks to:

- **Electron contributors** for making desktop app development accessible
- **The maintainers of 98.css** for keeping the retro UI spirit alive
- **The teams behind Gemini, OpenAI, Anthropic, and OpenRouter** for the model APIs used by the app
- **The `node-edge-tts` project** for speech synthesis support

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/JonusNattapong/Clippy.git
cd Clippy
npm ci
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your API key for at least one provider:
   - `GEMINI_API_KEY` - Google Gemini
   - `OPENAI_API_KEY` - OpenAI
   - `ANTHROPIC_API_KEY` - Anthropic
   - `OPENROUTER_API_KEY` - OpenRouter

Or simply open the app and go to Settings to enter your API key directly.

Optional:

- Add `TAVILY_API_KEY` if you want web search and URL fetching features

### Run Development

```bash
npm start
```

### Build

```bash
npm run make
```

---

## Memory System

Memories are stored locally and organized into categories such as `fact`, `preference`, `event`, and `relationship`. The app also keeps relationship and mood-related stats, including bond level, happiness, response style, user tone, and total interactions.

You can inspect, search, edit, delete, and maintain stored memories from the Memory settings screen.

---

## License

Non-Commercial (See [LICENSE.md](LICENSE.md) for details)
