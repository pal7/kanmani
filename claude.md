# CLAUDE.md — Kanmani(கண்மணி)

> Bilingual Tamil-English AI Chat Assistant
> Single source of truth for architecture, conventions, and decisions.
> Claude Code: read this fully before any task. Update it when decisions change.

---

## 1. Product Identity

| Field | Value |
|---|---|
| Name | Kanmani(கண்மணி) |
| Tagline | கண்மணி · Bilingual AI |
| Logo glyph | ஃ |
| Audience | Tamil speakers — India, Toronto diaspora, global |
| Primary UX language | English (default) |
| Secondary UX language | Tamil (toggle) |
| Delivery | PWA, mobile-first, Android primary |
| Differentiator | Production-quality bilingual UX; competitors (Lavanya, Chat AI Tamil, TamilAI.in) are basic |
| Project goal | Learning + portfolio piece demonstrating senior-leaning frontend + AI engineering |

---

## 2. Tech Stack — Locked

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast HMR, lean PWA bundle, TS for safety |
| Styling | TailwindCSS + CSS variables | Brand tokens centralized, utility speed |
| State | Zustand | Lighter than Redux, fine for chat |
| PWA | Vite PWA plugin (Workbox) | Installable, offline shell, font caching |
| Backend | Node 20 + Express + TypeScript | Matches frontend stack, simple |
| AI | Azure AI Foundry | User requirement, Azure-native |
| Primary model | `gpt-4o` deployment | Best Tamil quality |
| Cost model | `gpt-4o-mini` deployment | English + auto-title generation |
| Experimental | `Phi-4` deployment | Future on-region Tamil A/B test |
| Streaming | SSE (Server-Sent Events) | Better than WS for one-way streams |
| Auth | Supabase Auth | Email + Google OAuth |
| DB | Supabase Postgres | Same vendor as auth, RLS built-in |
| Hosting (frontend) | Azure Static Web Apps | Free tier, global CDN |
| Hosting (backend) | Azure App Service (Linux, B1) | Existing DevOps familiarity |
| Secrets | Azure Key Vault (prod) / `.env` (dev) | Never in client code |
| CI/CD | Azure DevOps Pipelines | User's existing toolchain |
| Fonts | Fraunces, DM Sans, Noto Sans Tamil — self-hosted | Google Fonts CDN unreliable in IN |
| Tokenization | `tiktoken` (`o200k_base`) | Accurate token counts for GPT-4o family |
| Logging | Pino | Structured JSON logs |
| Validation | Zod | Runtime safety at all boundaries |
| Testing | Vitest (unit) + Playwright (E2E, Phase 2) | Vite-native, fast |

**Rule:** No additional dependencies without justification in a commit message. Bundle size matters.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client (PWA)                          │
│   React + TS · Vite · Tailwind · Workbox SW              │
│   ┌────────────────────────────────────────────────────┐ │
│   │ LanguageContext (en | ta)                          │ │
│   │  ├─ UI strings (i18n)                              │ │
│   │  ├─ System prompt selector                         │ │
│   │  └─ Font loader                                    │ │
│   └────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS · Bearer JWT (Supabase)
                           │ SSE for streaming
┌──────────────────────────▼───────────────────────────────┐
│                  API Server (Node/Express)                │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Middleware: auth, rate-limit, CORS, logging     │   │
│   ├──────────────────────────────────────────────────┤   │
│   │  POST /api/chat/stream    (SSE)                  │   │
│   │  GET  /api/chats          (list user chats)      │   │
│   │  GET  /api/chats/:id      (messages)             │   │
│   │  POST /api/chats          (new chat)             │   │
│   │  DELETE /api/chats/:id                           │   │
│   ├──────────────────────────────────────────────────┤   │
│   │  ModelRouter → AzureFoundryClient                │   │
│   │  ContextBuilder (token-aware window)             │   │
│   │  SystemPromptRegistry (en, ta)                   │   │
│   │  TitleGenerator (gpt-4o-mini)                    │   │
│   └──────────────────────────────────────────────────┘   │
└───────────┬────────────────────────────┬─────────────────┘
            │                            │
┌───────────▼──────────────┐  ┌──────────▼─────────────────┐
│   Azure AI Foundry        │  │       Supabase              │
│   gpt-4o (Tamil)          │  │  Auth (email + Google)      │
│   gpt-4o-mini (English)   │  │  Postgres + RLS             │
│   Phi-4 (experimental)    │  │  Tables: chats, messages    │
└───────────────────────────┘  └─────────────────────────────┘
```

---

## 4. Repository Layout

```
mozhiyar/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .editorconfig
├── .nvmrc                          # node 20
├── package.json                    # workspace root
├── pnpm-workspace.yaml
│
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── icons/                  # 192, 512, maskable
│   │   └── fonts/                  # self-hosted woff2
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css               # Tailwind + CSS vars
│       ├── lib/
│       │   ├── api.ts              # fetch wrapper, SSE parser
│       │   ├── supabase.ts
│       │   └── tokens.ts
│       ├── i18n/
│       │   ├── index.ts            # useT() hook
│       │   ├── en.ts
│       │   └── ta.ts
│       ├── stores/
│       │   ├── chatStore.ts        # Zustand
│       │   └── uiStore.ts          # lang, theme
│       ├── components/
│       │   ├── AuthOverlay.tsx
│       │   ├── ChatWindow.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── InputBar.tsx
│       │   ├── LanguageToggle.tsx
│       │   ├── SuggestionChips.tsx
│       │   ├── TypingIndicator.tsx
│       │   ├── Sidebar.tsx
│       │   └── BrandMark.tsx       # the ஃ glyph
│       ├── hooks/
│       │   ├── useChat.ts
│       │   ├── useAuth.ts
│       │   └── useLanguage.ts
│       └── pages/
│           ├── ChatPage.tsx
│           └── AuthPage.tsx
│
├── server/
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── index.ts                # express boot
│       ├── env.ts                  # zod-validated env
│       ├── middleware/
│       │   ├── auth.ts             # Supabase JWT verify
│       │   ├── rateLimit.ts
│       │   └── error.ts
│       ├── routes/
│       │   ├── chat.ts             # SSE stream
│       │   └── chats.ts            # CRUD
│       ├── ai/
│       │   ├── foundryClient.ts    # Azure SDK wrapper
│       │   ├── modelRouter.ts      # lang → model mapping
│       │   ├── contextBuilder.ts   # token-aware window
│       │   ├── systemPrompts.ts    # en, ta registries
│       │   └── titleGenerator.ts   # gpt-4o-mini, lang-aware
│       ├── db/
│       │   ├── supabase.ts
│       │   └── repositories/
│       │       ├── chats.ts
│       │       └── messages.ts
│       └── lib/
│           ├── logger.ts           # pino
│           └── tokens.ts           # tiktoken
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql           # tables + RLS
│   │   └── 0002_indexes.sql
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SYSTEM_PROMPTS.md           # versioned prompt registry
│   ├── DESIGN.md                   # Kolam aesthetic, tokens
│   ├── DEPLOYMENT.md
│   └── adr/
│       ├── 0001-streaming-sse-over-websockets.md
│       ├── 0002-native-tamil-over-translation-pivot.md
│       ├── 0003-supabase-over-self-rolled-auth.md
│       ├── 0004-azure-foundry-over-openai-direct.md
│       ├── 0005-pwa-over-native.md
│       └── 0006-model-routing-by-language.md
│
└── .azure/
    ├── pipelines/
    │   ├── client.yml
    │   └── server.yml
    └── bicep/                      # infra-as-code (later)
```

---

## 5. Data Model

```sql
-- supabase/migrations/0001_init.sql

create table public.chats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  language    text not null check (language in ('en','ta')),
  model       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  tokens_in   int,
  tokens_out  int,
  created_at  timestamptz not null default now()
);

create index messages_chat_id_created_at on public.messages(chat_id, created_at);
create index chats_user_id_updated_at    on public.chats(user_id, updated_at desc);

alter table public.chats    enable row level security;
alter table public.messages enable row level security;

create policy "users read own chats"     on public.chats
  for select using (auth.uid() = user_id);
create policy "users write own chats"    on public.chats
  for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own messages"  on public.messages
  for select using (exists (
    select 1 from public.chats c where c.id = messages.chat_id and c.user_id = auth.uid()
  ));
create policy "users write own messages" on public.messages
  for all    using (exists (
    select 1 from public.chats c where c.id = messages.chat_id and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.chats c where c.id = messages.chat_id and c.user_id = auth.uid()
  ));
```

---

## 6. Bilingual Strategy — The Hard Parts

### 6.1 Language as first-class context
- `LanguageContext` carries `'en' | 'ta'`.
- The toggle changes: UI strings, system prompt, font stack, input placeholder.
- Language is **per chat**, persisted in `chats.language`. Mid-chat switch rotates the system prompt.

### 6.2 Model routing
```ts
// server/src/ai/modelRouter.ts
const routes = {
  en: 'gpt-4o-mini',   // cost-optimal, quality sufficient
  ta: 'gpt-4o',        // Tamil tokenization + quality needs full model
} as const;
```
- Tamil consumes ~3–4× more tokens per character than English in the GPT-4o tokenizer.
- Per-chat override via `chats.model` for power users / experiments.
- Auto-titles always use `gpt-4o-mini` regardless of chat language (titles don't need the big model).

### 6.3 System prompts (versioned)
- Stored in `server/src/ai/systemPrompts.ts` with version tags (`v1.0.0-en`, `v1.0.0-ta`).
- Tamil prompt is **written in Tamil**, not translated. It establishes:
  - Register tolerance: formal (இலக்கிய), casual (பேச்சு), code-mixed (Tanglish).
  - Output mirror: match the user's register.
  - No forced transliteration: respond in the script the user is currently using.
  - Cultural grounding: Tamil months, festivals, regional context.
- Changelog and full text live in `docs/SYSTEM_PROMPTS.md`.

### 6.4 Context window — token-aware, not message-count
- Target: ~3000 tokens history for English chats, ~2000 tokens for Tamil (denser per char).
- Use `tiktoken` (`o200k_base`) to measure, not message count.
- Always include the system prompt; truncate oldest turns first; never split a turn.

### 6.5 Font loading
- Noto Sans Tamil self-hosted at `/fonts/noto-tamil-{400,500,700}.woff2`.
- Workbox precaches Tamil font files so first-paint in Tamil works offline.
- When `lang="ta"`, font stack switches to `'Noto Sans Tamil', 'DM Sans', sans-serif`.

---

## 7. API Contract

### `POST /api/chat/stream`  (SSE)
**Headers:** `Authorization: Bearer <supabase_jwt>`, `Content-Type: application/json`
**Body:**
```json
{
  "chatId": "uuid | null",
  "message": "string",
  "language": "en" | "ta"
}
```
**Response:** `text/event-stream`
```
event: meta
data: {"chatId":"uuid","messageId":"uuid","model":"gpt-4o"}

event: delta
data: {"text":"..."}

event: done
data: {"tokens_in":123,"tokens_out":456}

event: error
data: {"code":"...","message":"..."}
```

### REST endpoints
- `GET /api/chats` — list user's chats, sorted `updated_at desc`
- `GET /api/chats/:id` — chat + messages
- `POST /api/chats` — create empty chat (rarely used; usually created implicitly via `/chat/stream`)
- `DELETE /api/chats/:id`

All require auth. RLS enforces ownership.

---

## 8. Design System

| Token | Value |
|---|---|
| `--color-bg` | `#FAF6F0` (warm paper) |
| `--color-ink` | `#1A1A1A` (deep ink) |
| `--color-accent` | `#C24A2D` (terracotta) |
| `--color-accent-soft` | `#E8D4C4` |
| `--color-muted` | `#6B6357` |
| `--font-display` | Fraunces (logo, headings) |
| `--font-body-latin` | DM Sans |
| `--font-body-tamil` | Noto Sans Tamil |
| `--radius` | `12px` |
| `--shadow-soft` | `0 2px 8px rgba(26,26,26,0.06)` |

- Visual motif: subtle Kolam (கோலம்) pattern on empty-state and auth backgrounds — sparingly.
- The `ஃ` glyph is the brand mark.
- Dark mode in Phase 2.

Full token sheet and component specs in `docs/DESIGN.md`.

---

## 9. Environment Variables

```bash
# server .env
PORT=8787
NODE_ENV=development

AZURE_FOUNDRY_ENDPOINT=https://<resource>.services.ai.azure.com
AZURE_FOUNDRY_API_KEY=<from-key-vault-in-prod>
AZURE_FOUNDRY_DEPLOYMENT_GPT4O=gpt-4o
AZURE_FOUNDRY_DEPLOYMENT_GPT4O_MINI=gpt-4o-mini
AZURE_FOUNDRY_DEPLOYMENT_PHI4=phi-4
AZURE_FOUNDRY_API_VERSION=2024-10-21

SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# client .env
VITE_API_BASE_URL=http://localhost:8787
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

`.env.example` is committed. Real `.env` is gitignored. Production uses Azure Key Vault.

---

## 10. Conventions

- **TypeScript strict** everywhere. No `any` without `// eslint-disable-next-line` + reason.
- **Zod** for env, request bodies, AI response shapes.
- **Pino** for structured logs. No `console.log` in committed code.
- **Imports:** absolute `@/` alias in client and server.
- **Components:** one per file, named export, `.tsx`.
- **Commits:** Conventional Commits. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- **Branches:** `main` protected; work on `feat/<name>` and PR.
- **Tests:** Vitest for unit. Smoke test on `/api/chat/stream` is mandatory for MVP.

---

## 11. Phase 1 — MVP Scope

Ship when end-to-end:

1. ✅ Sign up / sign in (email) via Supabase. — Google SSO deferred to TODO (see §16).
2. ✅ Send English message → streamed GPT-4o-mini reply. — working locally as of 2026-06-18.
3. ✅ Toggle to Tamil → send Tamil message → streamed GPT-4o reply in Tamil script.
4. ✅ Sidebar lists prior chats; click reopens with full history.
5. ✅ Delete a chat.
6. ⬜ PWA installable on Android; app shell works offline. — Workbox config in place; not yet tested on device.
7. ⬜ Deployed: Static Web Apps + App Service. Smoke test passes against prod. — GitHub Actions CI/CD wired; full prod deploy pending.

**Out of MVP:** file uploads, image input, voice, sharing, custom prompts, model picker UI, dark mode.

---

## 12. Phase 2 — Planned

- Voice input + TTS (Azure Speech, Tamil ASR/TTS native).
- Markdown rendering with Tamil-aware line-breaking.
- Per-message regenerate + model switch UI.
- Dark mode.
- Shareable read-only chat links.
- Phi-4 A/B test for Tamil.
- iOS PWA polish.
- Per-user soft daily token cap.
- Fetch-polling fallback for SSE.

---

## 13. Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Azure Foundry Tamil quality varies by topic | Versioned prompts; thumbs-up/down telemetry per language |
| Tamil tokens 3–4× cost | Model routing; per-user soft daily cap (Phase 2) |
| Google Fonts CDN blocked in regions | Self-host fonts |
| Supabase free tier limits | Plan for Pro at ~100 DAU |
| SSE behind corporate proxies | Fetch-polling fallback (Phase 2) |
| Tamil input on Android keyboards | Onboarding tip for Gboard Tamil |
| Azure Foundry regional availability for Phi-4 | Document deployment region in `docs/DEPLOYMENT.md` |

---

## 14. Architecture Decision Records (ADRs)

Each ADR lives as a standalone file under `docs/adr/` and follows the same shape: **Status · Context · Decision · Consequences · Alternatives considered**. Summaries below; see the files for full reasoning.

### ADR-0001 — SSE over WebSockets for streaming
**Status:** Accepted.
**Context:** Chat needs token-by-token streaming; we need bidirectional only for the next user message, not during a response.
**Decision:** SSE (`text/event-stream`) for model output streaming. Plain POST for user input.
**Consequences:** Simpler server code (no upgrade handshake), works through most proxies, browser-native `EventSource` with auth handled by `fetch` + `ReadableStream` reader. Reconnect is application-level, which is fine for a chat product.
**Alternatives:** WebSockets (over-engineered for one-way streams), polling (poor UX for streaming).

### ADR-0002 — Native Tamil end-to-end, not translation-pivot
**Status:** Accepted.
**Context:** Tamil consumes 3–4× tokens vs English; pivoting via English translation would cut input cost.
**Decision:** Keep Tamil native end-to-end. Use model routing and tighter context window for cost control instead.
**Consequences:** Higher per-Tamil-token cost, but preserves register, code-mixing (Tanglish), streaming UX, and cultural context — the actual differentiators against competitors.
**Alternatives considered:** Translate input EN → call model → translate output TA. Rejected because: two translation hops degrade quality, kill code-mixing, add ~500ms latency, break streaming on the output side, and the cost saved is partly given back to the translation provider.

### ADR-0003 — Supabase over self-rolled auth
**Status:** Accepted.
**Context:** Need email + Google OAuth, user session management, and a Postgres database.
**Decision:** Supabase for both Auth and Postgres.
**Consequences:** One vendor for two concerns, RLS gives DB-level security, less code to maintain. JWT verification on the API is straightforward.
**Alternatives:** NextAuth + self-hosted Postgres (more code), Auth0 + separate DB (two vendors), Azure AD B2C (overkill for consumer app).

### ADR-0004 — Azure AI Foundry over OpenAI direct
**Status:** Accepted.
**Context:** Both expose GPT-4o; OpenAI direct is simpler.
**Decision:** Azure AI Foundry.
**Consequences:** Enterprise-grade data residency, Azure-native deployment (matches user's DevOps familiarity), unified billing with hosting, access to Phi-4 and other Microsoft models for future experiments. SDK is slightly more verbose; abstracted behind `foundryClient.ts`.
**Alternatives:** OpenAI direct (rejected — no Phi-4, no Azure billing integration). Anthropic/Google (rejected — user requirement is Azure).

### ADR-0005 — PWA over native (Android-first)
**Status:** Accepted.
**Context:** Target users primarily on Android; want installability and offline shell; no app-store launch needed.
**Decision:** PWA with Workbox service worker, Web App Manifest, maskable icons.
**Consequences:** Single codebase, instant updates, no store review. iOS support is degraded by Apple's PWA limits — accepted for MVP, polished in Phase 2.
**Alternatives:** React Native (more code, store overhead), Capacitor wrapper (worth revisiting if we need device APIs later).

### ADR-0006 — Model routing by language
**Status:** Accepted.
**Context:** Tamil costs more per token; English chats don't need GPT-4o's full capability for most queries.
**Decision:** Route by chat language: `en → gpt-4o-mini`, `ta → gpt-4o`. Title generation always on `gpt-4o-mini`. Per-chat override field exists.
**Consequences:** ~60-70% cost reduction on mixed traffic vs. all-`gpt-4o`. Quality risk on complex English queries (mitigated by override). Clean abstraction in `modelRouter.ts` lets us add Phi-4 routing later without API changes.
**Alternatives:** All `gpt-4o` (too expensive at scale), all `gpt-4o-mini` (Tamil quality insufficient), runtime model picker UI (added complexity, deferred to Phase 2).

---

## 15. How Claude Code Should Work In This Repo

1. **Always read CLAUDE.md first.** If a request conflicts with this file, surface it before acting.
2. **Stay inside the locked stack.** New deps require justification in the commit/PR.
3. **Follow the repo layout.** Don't invent new top-level folders without updating section 4.
4. **Update CLAUDE.md when architecture changes.** PRs that change architecture without updating this file are incomplete. Add a new ADR for any non-trivial decision.
5. **Bilingual default.** Any new UI string lands in both `en.ts` and `ta.ts`.
6. **No silent fallbacks.** If the Tamil model fails, surface it. Don't downgrade language silently.
7. **Token-awareness.** Use `lib/tokens.ts`, never `messages.length`, for window logic.
8. **Security defaults.** Never log message bodies. Never put secrets in client code. Verify Supabase JWT on every protected route.
9. **Streaming is non-negotiable.** Don't replace SSE with a non-streaming fetch as a "simplification". This is a portfolio-defining feature.
10. **Write the ADR before the code** when making an architectural choice. The reasoning is the artifact.

### ADR-0007 — Supabase auth.getUser() over manual jwtVerify
**Status:** Accepted.
**Context:** New Supabase projects (2024+) sign user session tokens with ES256 (asymmetric) instead of HS256. The original `jwtVerify` call used the legacy HS256 secret and rejected every real user token.
**Decision:** Replace `jwtVerify` with `adminSupabase.auth.getUser(token)` in `server/src/middleware/auth.ts`. `SUPABASE_JWT_SECRET` is now optional in env.ts.
**Consequences:** No key management on the server side; Supabase handles algorithm changes transparently. One extra network round-trip per request to Supabase Auth (negligible — same request would have been made for DB operations).
**Alternatives:** Fetch JWKS from `<project>.supabase.co/auth/v1/.well-known/jwks.json` and verify locally (more code, same result).

---

## 16. TODO / Deferred

| Item | Notes |
|---|---|
| Google SSO | Set up Google OAuth app → get Client ID + Secret → add to Supabase Auth > Providers > Google → add `https://dlabrsetyxxfkznfppkf.supabase.co/auth/v1/callback` to Google authorized redirect URIs |
| Prod deploy (web) | ✅ Done — `deploy-web.yml` live, all 4 GitHub secrets set |
| CORS for prod | **Next task** — Add `CLIENT_ORIGIN` env var to App Service (Static Web Apps domain), update `server/src/index.ts` CORS config to read it. Currently only `http://localhost:5173` is allowed; prod client requests will be blocked. |
| PWA device test | Install on Android, verify offline shell and Workbox font caching |

---

## 17. Dev Environment — Local Setup

**Dev user:** `ashwnramani@gmail.com` / `test123` (Supabase email auth, local dev only)

**Start server:**
```bash
cd server && pnpm dev
# runs on http://localhost:8787
```

**Start client:**
```bash
pnpm --filter @kanmani/client dev
# runs on http://localhost:5173
```

**Known local quirks:**
- Node 26 + tsx: use `node --env-file=.env --import tsx --watch src/index.ts` (not `tsx --env-file`).
- Pino transport (thread-stream) crashes on Node 26 — pipe to pino-pretty via shell in dev script instead.
- `postcss.config.js` must exist in `client/` for Tailwind JIT to work with Vite.
- `supabase/migrations/0003_grants.sql` must be applied before the DB will accept inserts (grants table privileges to `authenticated` and `service_role`; Supabase dashboard SQL editor is the easiest path).

---
*Document version: 1.2.0 — Phase 1 status, ADR-0007, TODO list, dev environment notes.*