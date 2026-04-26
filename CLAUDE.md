# Vitalytics

AI-powered health data analysis PWA. Users upload or input medical documents (PDFs, images, text) and get AI-driven explanations through a conversational chat interface.

**Browser-only architecture** — all processing happens client-side. No backend. Users bring their own API keys (BYOK). Deployed as a static site on Netlify.

## Quick Start

```bash
nvm use                  # uses .nvmrc (Node 22.22.2)
yarn install
yarn dev                 # dev server on localhost:5173
yarn build               # production build → dist/
yarn preview             # preview production build locally
```

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

## Key Conventions

- **No backend.** All API calls go directly from the browser. The OpenAI SDK uses `dangerouslyAllowBrowser: true`. API keys are user-provided (BYOK).
- **Credentials must never be hardcoded.** Use environment variables if needed.
- **PII masking** via `cognosys-redact-pii` on all text before it reaches Redux state.
- **Single Redux slice** (`appSlice`) manages all global state. Components should use hooks (`useSelector`/`useDispatch`), not the legacy `connect()` HOC.

## Branching Strategy

**Feature branches with PRs:**

```text
main              — stable, deployable at all times
  └── dev         — integration branch for current sprint
       ├── fix/performance
       └── feat/chat-history
```

- Feature branches are created off `dev`
- PRs merge into `dev`
- `dev` merges into `main` at sprint boundaries (when stable)
- Branch naming: `feat/<name>` for features, `fix/<name>` for bug fixes

## Planning Documents

All in `.claude/`:

| File               | Contents                                              |
| ------------------ | ----------------------------------------------------- |
| `FEATURES.md`      | Feature wishlist for the PWA                          |
| `DESIGN_SYSTEM.md` | Color palette, typography, layout, component patterns |

## Health Data Compliance

This app handles medical documents. Key rules:

- **Never log, persist, or transmit raw medical data** to analytics, error tracking, or any external service other than the user's chosen AI provider
- **PII masking is best-effort** — it won't catch all medical identifiers (MRN, insurance IDs, etc.)
- **AI responses are not medical advice** — the app disclaimer must always be visible
- **Data stays in-browser** — no server-side storage, no backend database
- **If a backend is ever added**, HIPAA considerations apply (BAAs, encryption at rest, audit logs)
