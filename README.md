# Renata

**Your CV, reborn.**

Renata is an AI-powered CV writing agent that guides you through building a professional, ATS-friendly resume — tailored to the role you want. No blank forms, no templates. Just a conversation.

Try it at [renata.trefolio.com](https://renata.trefolio.com)

## How it works

1. **Start a session** — Sign in and tell the agent what role you're targeting.
2. **Answer questions** — Upload your existing CV (PDF), share achievements, and refine the details through conversation.
3. **Get your CV** — Review the draft, request changes, then copy or export your polished CV.

Renata asks targeted questions to draw out what matters — key achievements, relevant skills, career transitions — then produces a structured, markdown-formatted CV optimised for applicant tracking systems.

## Features

- **Guided conversation** — Targeted questions, not a blank form. The agent draws out what matters.
- **PDF upload** — Drop in your existing CV and Renata will parse and understand it.
- **Web search** — Automatically researches the target company, role, and industry to enrich your CV with relevant keywords.
- **Multilingual** — Chat in any language. Choose a different language for the final CV if needed.
- **Stored sessions** — Come back anytime. Your conversations and drafts are preserved.
- **Telegram bot** — Link your account and build your CV from Telegram.
- **Secure by default** — Authentication required, always.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, [Base UI](https://base-ui.com) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai), Claude Sonnet |
| Auth | [NextAuth.js](https://next-auth.js.org) v5 (Google OAuth) |
| Database | PostgreSQL via [Neon](https://neon.tech), [Drizzle ORM](https://orm.drizzle.team) |
| Search | [Tavily](https://tavily.com) API |
| PDF parsing | [unpdf](https://github.com/unjs/unpdf) |

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (or any Postgres-compatible provider)
- Google OAuth credentials
- (Optional) [Tavily](https://tavily.com) API key for web search
- (Optional) Telegram bot token

### Setup

```bash
git clone https://github.com/kyberis/curriculumsupport.git
cd curriculumsupport
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Direct connection string (used for migrations) |
| `AUTH_SECRET` | NextAuth secret (generate with `npx auth secret`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

Optional variables:

| Variable | Description |
|----------|-------------|
| `TAVILY_API_KEY` | Enables web search during CV generation |
| `TELEGRAM_BOT_TOKEN` | Telegram bot integration |
| `TELEGRAM_BOT_USERNAME` | Telegram bot username |
| `TELEGRAM_WEBHOOK_SECRET` | Secures the Telegram webhook endpoint |
| `NEXT_PUBLIC_BTC_ADDRESS` | Bitcoin address for donation QR code |
| `NEXT_PUBLIC_ETH_ADDRESS` | Ethereum address for donation QR code |

### Database

Run migrations to set up the schema:

```bash
npm run db:migrate
```

Optionally inspect the database with Drizzle Studio:

```bash
npm run db:studio
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

## Project structure

```
app/
  (marketing)/           Landing page, terms, privacy
  dashboard/             Session list, settings, donate
  session/[id]/          Chat interface
  api/
    chat/                AI chat endpoint
    sessions/            Session CRUD + PDF export
    parse-cv/            PDF text extraction
    telegram/webhook/    Telegram bot webhook
lib/
  agent.ts               System prompt and agent config
  model.ts               AI model configuration
  auth.ts                Authentication setup
  db/                    Database connection and schema
  tools/                 AI tools (web search, set CV language)
  pdf-template.tsx       PDF export template
  rate-limits.ts         Daily usage limits
components/
  marketing/             Landing page components
  ui/                    Shared UI components
drizzle/                 Database migrations
```

## Rate limits

To keep the service free, usage is capped per user per day:

- **50 messages** across all sessions
- **3 new sessions**

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

This project is proprietary. See the repository for details.
