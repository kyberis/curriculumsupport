---
name: renata-cv-agent
description: >-
  Renata's AI CV agent behavior — system prompt, 6-step workflow, tools,
  language rules, and output format. Use when modifying the agent's behavior,
  adding tools, changing the prompt, or debugging agent responses.
---

# Renata — CV Agent Behavior

## Agent Identity

The AI assistant is named **Renata**. It is an expert CV/resume writing agent. Tone: professional, encouraging, specific. Never invents personal info — only uses what the user provides.

## System Prompt Location

`lib/agent.ts` — exports `CV_SYSTEM_PROMPT` and `MAX_CONTEXT_MESSAGES` (40).

The system prompt is augmented at runtime with:
- Uploaded CV content (`session.cvContent`)
- Target role (`session.targetRole`)
- CV language preference (`session.cvLanguage`)
- For Telegram: a note to keep responses concise

## 6-Step Workflow

The agent follows these steps **in order**, waiting for user input at each step:

### Step 1: Target Role & CV Language
- Ask what role the user is applying for (title, seniority, company/industry)
- Ask what language the CV should be written in
- Call `setCvLanguage` tool once the user answers

### Step 2: Existing CV
- Ask if they have an existing CV (PDF upload, LinkedIn URL, or start from scratch)
- If provided, summarize key points

### Step 3: Targeted Questions
- Ask 4–6 focused follow-ups, one or two at a time:
  - Key achievements (quantified)
  - Relevant skills/certifications
  - Gaps or transitions to frame
  - Preferred tone
  - Keywords from job description

### Step 4: Draft the CV
- Generate full CV in **markdown** using a specific template (see format below)
- Write in the user's chosen CV language

### Step 5: Review & Iterate
- Ask if user wants adjustments
- Explain how to convert to PDF (markdown editors, Google Docs)

### Step 6: Interview Preparation
- Use `webSearch` to research the target company
- Provide: company-specific tips, role-specific tips, interviewer tips (if names given), general advice
- Written in the **conversation language** (may differ from CV language)

## CV Output Format

```markdown
# [Full Name]

**[Latest Role Title]** | [Email] | [Phone] | [Location] | [LinkedIn URL]

## Professional Summary
[2–3 sentences tailored to the target role]

## Experience
### [Job Title] — [Company]
*[Start Date] – [End Date]*
- [Achievement-oriented bullet with metrics]

## Education
### [Degree] — [Institution]
*[Year]*

## Skills
[Comma-separated list]

## Certifications (if applicable)
- [Certification]
```

## Language Rules

1. **Respond in the user's conversation language** — auto-detect from latest message
2. **CV language is explicit** — user chooses it, agent records it with `setCvLanguage`
3. CV language and conversation language can differ (e.g. chat in Spanish, CV in English)
4. Default CV language = conversation language if user doesn't specify

## Tools

Defined in `lib/tools/`:

### `webSearch` (`lib/tools/web-search.ts`)
- Uses **Tavily API** (`TAVILY_API_KEY` env var)
- Searches for company info, role requirements, industry trends
- Returns up to 5 results + AI summary
- Agent should use proactively when user mentions a company or role
- Never searches for user's personal information

### `setCvLanguage` (`lib/tools/set-cv-language.ts`)
- Records the user's preferred CV language
- Called as soon as user indicates language preference
- The actual persistence happens in the `onFinish` callback of the chat route

## AI Provider Configuration

- **Vercel AI SDK v6** (`ai` package) with `gateway()` for model routing
- Models defined in `lib/model.ts`:
  - `anthropic/claude-sonnet-4.6` — Premium, 30 msg/day, default
  - `openai/gpt-5.4` — Premium, 30 msg/day
  - `openai/gpt-4o-mini` — Basic, 150 msg/day
  - `google/gemini-2.0-flash` — Basic, 150 msg/day
- `stopWhen: stepCountIs(5)` — max 5 agentic steps per turn
- Gateway tags: `model:{id}`, `feature:chat` or `feature:telegram`

## Generated CV Detection

A response is considered a generated CV if it contains both `"# "` and `"## Experience"`. When detected, it's saved to `session.generatedCv`.

## Chat Route Flow (`app/api/chat/route.ts`)

1. Authenticate user → get session → get model config
2. Check daily message limit → 429 if exceeded
3. Persist user message to DB
4. Load last 40 messages as context
5. Build system prompt (base + CV content + target role + language)
6. `streamText()` with model, system, messages, tools
7. `onFinish`: persist assistant message, detect CV language tool call, detect generated CV, log usage

## Telegram Integration

- Webhook at `app/api/telegram/webhook/route.ts`
- Uses `generateText` instead of `streamText` (non-streaming)
- Auto-creates a session if user has none active
- Splits long responses into 4000-char chunks
- Adds system note: "The user is chatting via Telegram. Keep responses concise."

## Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| `MAX_CONTEXT_MESSAGES` | 40 | `lib/agent.ts` |
| `MAX_SESSIONS_PER_DAY` | 3 | `lib/rate-limits.ts` |
| Premium daily msg limit | 30 | `lib/model.ts` |
| Basic daily msg limit | 150 | `lib/model.ts` |
| Max agentic steps | 5 | chat route |
