---
name: renata-architecture
description: >-
  Renata technical architecture — tech stack, database schema, API routes, auth,
  file structure, and infrastructure conventions. Use when adding features,
  debugging, writing migrations, or making architectural decisions.
---

# Renata — Technical Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| React | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS 4 + shadcn/ui v4 | ^4 / ^4.7.0 |
| Database | Neon Postgres (serverless) | @neondatabase/serverless ^1.1.0 |
| ORM | Drizzle ORM | ^0.45.2 |
| Auth | NextAuth v5 (beta) + Google OAuth | ^5.0.0-beta.31 |
| AI | Vercel AI SDK v6 + AI Gateway | ai ^6.0.177, @ai-sdk/react ^3.0.179 |
| Search | Tavily API | via fetch |
| PDF parsing | unpdf | ^1.6.2 |
| PDF rendering | @react-pdf/renderer | ^4.5.1 |
| Markdown | react-markdown + remark-gfm | ^10.1.0, ^4.0.1 |
| Icons | Lucide React | ^1.14.0 |
| Image export | html-to-image | ^1.11.13 |
| QR codes | qrcode.react | ^4.2.0 |
| Validation | Zod v4 | ^4.4.3 |
| Telegram | Telegram Bot API (via fetch) | — |

## Project Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/route.ts    # NextAuth handlers
│   ├── chat/route.ts                  # POST — streaming chat endpoint
│   ├── parse-cv/route.ts             # POST — PDF text extraction
│   ├── sessions/
│   │   ├── route.ts                   # GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts              # GET detail, PATCH update
│   │       ├── export-md/route.ts    # GET — download as markdown
│   │       ├── export-pdf/route.ts   # GET — download as PDF
│   │       └── export-tips/route.ts  # GET — download interview tips
│   ├── admin/
│   │   ├── users/
│   │   │   ├── route.ts             # GET all users (admin only)
│   │   │   └── [userId]/sessions/route.ts  # GET user's sessions
│   │   └── usage/route.ts           # GET usage stats
│   ├── settings/telegram/route.ts    # Telegram link management
│   └── telegram/webhook/route.ts     # POST — Telegram bot webhook
├── dashboard/
│   ├── page.tsx                      # User dashboard (session list)
│   ├── layout.tsx                    # Dashboard layout wrapper
│   ├── admin/page.tsx               # Admin dashboard
│   └── donate/page.tsx              # Donation page
├── session/[id]/page.tsx            # Chat interface
├── sign-in/page.tsx                 # Sign-in page
├── sign-up/page.tsx                 # Sign-up page (redirects to sign-in)
├── layout.tsx                       # Root layout (fonts, metadata)
├── globals.css                      # Tailwind config, CSS variables
└── page.tsx                         # Landing page (marketing)

components/
├── ui/                              # shadcn components
│   ├── button.tsx, card.tsx, badge.tsx, table.tsx
│   ├── scroll-area.tsx, dropdown-menu.tsx
│   ├── input.tsx, textarea.tsx, separator.tsx, avatar.tsx
├── marketing/
│   ├── nav.tsx                      # Top nav (server component)
│   ├── features-grid.tsx            # Feature cards
│   └── demo-chat.tsx               # Fake chat preview
└── donate-banner.tsx               # Post-CV donation prompt

lib/
├── agent.ts                         # CV_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES
├── auth.ts                          # getUserId(), requireAdmin(), getSession()
├── auth-config.ts                   # NextAuth config (Google, Drizzle adapter)
├── db/
│   ├── index.ts                     # Drizzle client (Neon)
│   └── schema.ts                    # All table definitions
├── marketing-content.ts             # siteConfig, heroContent, features, steps, demoMessages
├── model.ts                         # AVAILABLE_MODELS, model config, validation
├── rate-limits.ts                   # checkMessageLimit(), checkSessionLimit()
├── telegram.ts                      # sendMessage(), setWebhook(), generateLinkCode()
├── tools/
│   ├── index.ts                     # Tool exports
│   ├── web-search.ts               # Tavily web search tool
│   └── set-cv-language.ts          # CV language recording tool
└── utils.ts                         # cn() utility

drizzle/                             # Migration files
```

## Database Schema (`lib/db/schema.ts`)

### Auth Tables (NextAuth managed)

**users** — Core user table
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `crypto.randomUUID()` |
| name | text | nullable |
| email | text | unique, nullable |
| emailVerified | timestamp | |
| image | text | Google avatar URL |
| role | enum `user_role` | `user` or `admin`, default `user` |

**accounts** — OAuth accounts (composite PK: provider + providerAccountId)

**auth_sessions** — NextAuth session tokens

**verification_tokens** — Email verification (composite PK)

### App Tables

**sessions** — CV writing sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| user_id | text | FK users.id |
| title | text | default "Untitled session" |
| model | text | default `anthropic/claude-sonnet-4.6` |
| target_role | text | nullable |
| cv_content | text | extracted PDF text, nullable |
| generated_cv | text | final CV markdown, nullable |
| cv_language | text | nullable |
| status | enum | `in_progress` or `complete` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**messages** — Chat messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | cascade delete |
| role | enum | `user`, `assistant`, `system` |
| content | text | |
| created_at | timestamptz | |

**usage_logs** — AI cost tracking
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | cascade delete |
| user_id | text | |
| model | text | |
| input_tokens | integer | default 0 |
| output_tokens | integer | default 0 |
| cost_cents | integer | default 0 |
| created_at | timestamptz | |

**telegram_integrations** — Linked Telegram accounts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text FK | unique, cascade delete |
| chat_id | text | unique |
| username | text | nullable |
| first_name | text | |
| linked_at | timestamptz | |

**telegram_link_codes** — Ephemeral linking codes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text FK | cascade delete |
| code | text | unique, 6-char alphanumeric |
| expires_at | timestamptz | |
| created_at | timestamptz | |

## Authentication

- **NextAuth v5 beta** with `DrizzleAdapter`
- Single provider: **Google OAuth** (with `checks: ["state"]`)
- Custom sign-in page at `/sign-in`
- `trustHost: true` for deployment
- Session callback injects `user.id` and `user.role`
- Helper functions in `lib/auth.ts`:
  - `getUserId()` — returns user ID or throws Unauthorized
  - `requireAdmin()` — returns user ID or throws Forbidden
  - `getSession()` — returns full session object

## API Patterns

- All API routes use `getUserId()` or `requireAdmin()` for auth
- Admin routes check `role === "admin"`
- Rate limits return HTTP 429 with `{ error, remaining }`
- Sessions are scoped to the authenticated user (enforced in queries)
- Streaming responses via `result.toUIMessageStreamResponse()`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `TAVILY_API_KEY` | Web search API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook verification secret |

## Database Commands

```bash
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Apply migrations
npm run db:studio     # Open Drizzle Studio
```

## Key Conventions

- All pages are client components (`"use client"`) except server components like `Nav`
- Drizzle queries use functional API (`select().from().where()`)
- Cost calculation: `ceil((inputTokens * pricePerM + outputTokens * pricePerM) / 10000)` → cents
- Model routing: `gateway(modelId)` from Vercel AI SDK
- Exported types: `User`, `Session`, `NewSession`, `Message`, `NewMessage`, `UsageLog`, `TelegramIntegration`, `TelegramLinkCode`
