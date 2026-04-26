# Changelog

All notable changes to this project are documented in this file.

## [0.1.0-beta.1] — 2026-04-26

MVP release. Full PWA with multi-provider AI, chat-first UI, and health data analysis.

### Added

- **PWA foundation** — manifest, service worker, offline shell via Workbox
- **Chat-first UI** — sidebar with conversation history, chat input with presets and autocomplete, IndexedDB persistence via Dexie
- **Multi-provider AI** — OpenAI (GPT-4o Mini, GPT-4o, o3-mini), Anthropic (Haiku, Sonnet, Opus), Google Gemini (2.5 Flash, 2.0 Flash, 2.5 Pro)
- **Streaming responses** — real-time token-by-token output from all three providers
- **Agentic mode** — "Auto (smart routing)" model option that classifies query complexity and picks the appropriate tier
- **Data control** — PII masking (all / names-only / none), review-before-send modal, first-run disclaimer
- **Export** — conversations as Markdown, JSON, or plain text; clipboard copy; share via email and WhatsApp; full IndexedDB JSON export
- **API call logging** — per-conversation logs with provider, model, latency, token counts, cost estimates
- **Token usage dashboard** — global stats (API calls, tokens, cost, latency), daily usage chart, per-provider and per-model tables, input/output breakdown
- **Workflow view** — per-conversation API call timeline correlating messages with logs
- **Storage stats** — local database usage (conversations, messages, logs, bytes used) with configurable 4 GB cap
- **Dark/light/system theme** — CSS custom properties with automatic detection
- **File attachments** — PDF text extraction, image OCR (Tesseract.js), text files; up to 5 per message
- **Speech-to-text** — Web Speech API dictation with live transcription
- **User onboarding** — 3-step wizard (nickname, background, interests) that personalizes AI responses
- **User profile** — editable anytime in Settings; shapes system prompt (clinical terminology for physicians, plain language for general users)
- **Temporary chats** — session-only conversations auto-deleted on next visit
- **Conversation management** — rename (inline edit + AI-generated titles), tags, delete via ellipsis menu
- **Tone & detail settings** — professional/friendly/simple tone; brief/standard/detailed responses
- **Browser notifications** — Notification API alerts for background responses
- **Medical guardrails** — image conversations restricted to medical context
- **About / Terms of Use** — in-app modal with build info, features overview, privacy details
- **App logo** — dual speech bubbles with medical cross
