---
name: renata-product
description: >-
  Renata product knowledge — what it is, who it serves, core flows, features,
  brand voice, and business rules. Use when building new features, writing copy,
  making product decisions, or whenever context about Renata's purpose is needed.
---

# Renata — Product Knowledge

## What is Renata

Renata is a free, AI-powered CV/resume writing agent deployed at `renata.trefolio.com`. Users sign in with Google, start a session, and have a guided conversation with an AI assistant (named "Renata") that helps them build a professional, ATS-friendly CV tailored to a specific target role. The product also offers interview preparation tips once the CV is ready.

**Tagline**: "Your CV, reborn."

**One-liner**: An AI agent that guides you through building a professional, ATS-friendly CV — tailored to the role you want.

## Target Users

- Job seekers at any seniority level
- Career changers who need to reframe their experience
- Non-native English speakers (multilingual support: conversation and CV language can differ)
- People without access to expensive career coaching

## Core User Flow

```
Landing page → Sign in (Google) → Dashboard → New Session (pick model) →
Chat with Renata → Upload CV / answer questions → Get draft CV →
Iterate → Export (MD / JPG / PDF) → Interview tips → Done
```

### Step-by-step

1. **Landing page** — marketing hero, feature grid, demo chat preview, how-it-works steps
2. **Sign in** — Google OAuth via NextAuth (custom `/sign-in` page)
3. **Dashboard** — list of past sessions (cards with title, target role, model, status, date). Button to start a new session
4. **Model picker modal** — choose between premium models (Claude Sonnet 4.6, GPT-5.4) and basic models (GPT-4o Mini, Gemini 2.0 Flash). Shows tier badge and daily message limit
5. **Session chat** — full-screen chat interface with Renata's avatar, markdown rendering, PDF upload, inline title editing, export dropdown
6. **Export** — Markdown file, JPG screenshot of the chat, or interview tips as a separate download
7. **Donate banner** — appears after a CV is generated. Non-pushy, in Spanish: "Si este proyecto te ayudó..."

## Features

| Feature | Description |
|---------|-------------|
| Guided CV writing | 6-step agent workflow: target role → existing CV → questions → draft → iterate → interview tips |
| PDF upload & parsing | Upload a PDF CV, text extracted server-side with `unpdf` |
| Web search | Agent uses Tavily to research companies, roles, and industry trends |
| Multi-model | 4 models across 3 providers, routed through Vercel AI Gateway |
| Rate limiting | Daily message limits per model tier + max 3 sessions/day |
| Multilingual | Conversation language auto-detected; CV language explicitly chosen |
| Interview prep | Company/role/interviewer-specific tips using web search |
| Export | Markdown download, JPG screenshot, interview tips export |
| Telegram bot | Chat with Renata via Telegram (link account with 6-char code) |
| Admin dashboard | User list, session drill-down, cost tracking by model and user |
| Donations | Optional donate page shown after CV generation |

## Brand Voice

- **Professional but warm** — encouraging, never condescending
- **Concise** — no filler, no corporate jargon in UI copy
- **Bilingual DNA** — admin UI uses some Spanish naturally ("Administración", "Gasto por modelo"); user-facing product is English-first but fully multilingual in conversations
- **Visual identity** — dark mode only (`#0d1117` background), amber/gold accent (`amber-500`/`amber-600`), serif font for headings (EB Garamond), sans-serif body (Geist)

## Business Rules

- Max **3 sessions per day** per user
- Premium models: **30 messages/day**; basic models: **150 messages/day**
- Sessions have statuses: `in_progress` or `complete`
- Users have roles: `user` or `admin`
- Admin page at `/dashboard/admin` — only accessible to users with `admin` role
- Usage tracking: every AI response logs input/output tokens and cost in cents
- The product is free; donations are optional and encouraged after CV generation
