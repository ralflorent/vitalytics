# Vitalytics

[![Netlify Status](https://api.netlify.com/api/v1/badges/f46ebaa4-5a2a-42d4-821e-2cfc63ce5de7/deploy-status)](https://app.netlify.com/projects/namefully/deploys)

AI-powered health data analysis PWA. Upload or input medical documents (PDFs, images, text) and get AI-driven explanations through a conversational chat interface.

**Browser-only architecture** — all processing happens client-side. No backend. Users bring their own API keys (BYOK). Deployed as a static site on Netlify.

## Features

- **Chat-first UI** — conversational interface with preset prompts and autocomplete
- **Multi-provider AI** — OpenAI, Anthropic, and Google Gemini with model selection (fast / standard / reasoning tiers)
- **Streaming responses** — real-time token-by-token output from all three providers
- **Agentic mode** — automatic model routing based on query complexity (fast for simple, reasoning for complex)
- **File attachments** — PDF, image (OCR via Tesseract.js), and text file extraction (up to 5 per message)
- **Speech-to-text** — dictation via Web Speech API with live transcription
- **PII masking** — automatic redaction of personal data before sending to AI
- **Review before send** — preview masked text before it reaches the provider
- **Conversation history** — persistent chat history stored in IndexedDB (Dexie)
- **Temporary chats** — session-only conversations that auto-delete on next visit
- **Tags** — organize conversations with color-coded tags
- **AI-generated titles** — automatic conversation naming after first response
- **Export** — Markdown, JSON, plain text, clipboard, email, WhatsApp, and full data export
- **Token usage dashboard** — global stats, daily charts, per-provider and per-model breakdowns, cost estimates
- **Workflow view** — per-conversation API call timeline with latency, tokens, and cost per step
- **Storage stats** — local database usage with configurable 4 GB cap
- **User onboarding** — 3-step wizard (nickname, background, interests) that shapes AI responses
- **Dark/light/system theme** — automatic or manual theme switching
- **Tone & detail settings** — professional/friendly/simple tone, brief/standard/detailed responses
- **Browser notifications** — alerts when AI responses arrive while the tab is in the background
- **Medical guardrails** — image conversations restricted to medical context
- **About / Terms of Use** — in-app modal with build info and privacy details
- **PWA** — installable, offline shell, service worker via Workbox

## Quick Start

```bash
nvm use                  # Node 22 (see .nvmrc)
yarn install
yarn dev                 # dev server on localhost:5173
yarn build               # production build -> dist/
yarn preview             # preview production build
```

## Tech Stack

| Layer      | Technology                                                   |
| ---------- | ------------------------------------------------------------ |
| Build      | Vite 8                                                       |
| Language   | TypeScript (strict)                                          |
| Framework  | React 18                                                     |
| State      | React hooks + localStorage                                   |
| Styling    | Styled Components + Ant Design 5                             |
| AI         | OpenAI SDK, Anthropic SDK, Google GenAI SDK (browser-direct) |
| Storage    | IndexedDB via Dexie                                          |
| PWA        | vite-plugin-pwa + Workbox                                    |
| Testing    | Vitest + Testing Library                                     |
| Deployment | Netlify (static)                                             |

## Project Structure

```text
src/
  components/
    App.tsx                 — main layout (grid shell, sidebar, top bar, footer)
    chat/                   — ChatView, ChatInput, ChatMessage, ExportMenu, ReviewModal,
                              ConversationStats, WorkflowDrawer
    conversations/          — ConversationSidebar (history, tags, temp chats)
    settings/               — SettingsDrawer (provider, theme, tone, privacy, keys, storage),
                              UsageDashboard (token stats, charts, storage usage)
    common/                 — ErrorBoundary, FirstRunDisclaimer, OnboardingWizard, AboutModal
  providers/
    registry.ts             — provider registration, key management, model-by-tier lookup
    openai.provider.ts      — OpenAI (GPT-4o Mini, GPT-4o, o3-mini)
    anthropic.provider.ts   — Anthropic (Haiku, Sonnet, Opus)
    gemini.provider.ts      — Google Gemini (2.5 Flash, 2.0 Flash, 2.5 Pro)
    types.ts                — shared provider/session/streaming interfaces
  db/
    index.ts                — Dexie database schema (conversations, messages, logs)
    conversations.ts        — CRUD operations, storage stats
    logs.ts                 — API call logging and usage summaries
  hooks/
    useTheme.ts             — dark/light/system theme management
    useSpeechRecognition.ts — Web Speech API wrapper
  types/
    profile.ts              — user profile types and constants
  utils/                    — PDF/image/text extraction, export, pricing
  shared/                   — utilities (file size formatting)
```

## Configuration

API keys are managed in-app via the Settings drawer. They're stored in `localStorage` and never leave the browser (except to the chosen AI provider).

No `.env` file is required for normal use. The `.env.example` file documents optional Vite environment variables for development.

## Health Data Compliance

This app handles medical documents. Key rules:

- **Never log, persist, or transmit raw medical data** to analytics, error tracking, or any external service other than the user's chosen AI provider
- **PII masking is best-effort** — it won't catch all medical identifiers
- **AI responses are not medical advice** — the app disclaimer is always visible
- **Data stays in-browser** — no server-side storage, no backend database

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
