import { generateText, gateway } from "ai";
import { db } from "@/lib/db";
import { messages, sessions, usageLogs, users } from "@/lib/db/schema";
import { MAX_CONTEXT_MESSAGES, SUMMARY_INTERVAL } from "@/lib/agent";
import { getModelConfig, SUMMARY_MODEL } from "@/lib/model";
import { eq, asc, desc, sql, and, isNotNull } from "drizzle-orm";
import type { Session } from "@/lib/db/schema";

/** Minimum user messages before generating a shareable session summary. */
const SESSION_SUMMARY_MIN_USER_MESSAGES = 2;

/** Regenerate session summary every N user messages. */
const SESSION_SUMMARY_UPDATE_INTERVAL = 4;

/** Max past session summaries to merge into the user profile. */
const MAX_SESSIONS_IN_PROFILE = 10;

export const SUMMARY_PROMPT = `You summarize Renata CV coaching conversations for internal continuity.

Produce a concise factual summary in the same language as the conversation. Include only what appears in the messages:
- Target role, seniority, company/industry if mentioned
- CV language preference
- Whether they uploaded a CV, LinkedIn, or started from scratch
- Key facts about the user (name, experience, skills, achievements) they shared. Never treat "Renata" as the user's name — Renata is the assistant.
- Job description highlights if shared
- Current workflow step (1–6) and what was decided or skipped
- Gap analysis findings if any
- Whether a CV draft was generated or revised

Do not invent information. Keep under 400 words. Use bullet points.`;

export const SESSION_SUMMARY_PROMPT = `You create a shareable summary of a Renata CV coaching session for cross-session memory.

This summary will be shown to Renata in future sessions so she remembers the user. Include only facts from the conversation:
- User's name and contact details if shared (never use "Renata" as the user's name — Renata is the assistant)
- Professional background, experience, skills, achievements
- Target roles explored (title, company, industry)
- CV language preferences
- Whether a CV was drafted and for which role
- Gap analysis conclusions if any
- Interview prep topics if covered
- Preferences the user expressed (tone, format, etc.)

Do not invent information. Keep under 300 words. Use bullet points. Write in the conversation language.`;

export const USER_PROFILE_PROMPT = `You maintain a consolidated user profile for Renata CV coaching across multiple sessions.

Merge session summaries into one profile that helps Renata personalize future conversations. Include:
- Stable facts about the user (name, background, skills, career goals). Never set the user's name to "Renata" — that is the assistant's name.
- Roles they have applied for or are targeting
- CV languages they prefer
- Recurring themes or preferences
- What was accomplished in past sessions (CVs drafted, gap analyses, interview prep)

Drop outdated or superseded info when newer sessions contradict it.
Do not invent information. Keep under 500 words. Use bullet points.`;

export function appendSummaryToSystem(
  systemContent: string,
  session: Pick<Session, "conversationSummary">
): string {
  if (!session.conversationSummary?.trim()) return systemContent;
  return `${systemContent}

## Conversation history summary
The following summarizes earlier messages not shown below. Use it for continuity; do not repeat it verbatim to the user.

${session.conversationSummary.trim()}`;
}

export function appendUserIdentityToSystem(
  systemContent: string,
  userName: string | null | undefined
): string {
  const name = userName?.trim();
  if (name) {
    return `${systemContent}

## User identity
- You are Renata — the AI assistant. "Renata" is NEVER the user's name and must never appear as the candidate name in a CV, greeting, or summary.
- The user's account name on file is: **${name}**.
- Use this name for greetings and the CV "# Full Name" heading unless the user (or their uploaded CV / LinkedIn / past profile) provides a different preferred name — then prefer that.
- If they correct their name, use the correction going forward.`;
  }
  return `${systemContent}

## User identity
- You are Renata — the AI assistant. "Renata" is NEVER the user's name and must never appear as the candidate name in a CV, greeting, or summary.
- No account name is on file. Use the name from their uploaded CV, LinkedIn, or user profile memory if available; otherwise ask for their full name before drafting the CV.`;
}

export function appendUserProfileToSystem(
  systemContent: string,
  profileSummary: string | null | undefined
): string {
  if (!profileSummary?.trim()) return systemContent;
  return `${systemContent}

## User profile from past sessions
The following summarizes what you know about this user from previous coaching sessions. Use it to personalize the conversation — reference relevant past work naturally, avoid re-asking for information you already have, and acknowledge returning users warmly. Do not read this list aloud or mention "past sessions" unless the user brings it up.

${profileSummary.trim()}`;
}

export type UserAgentContext = {
  name: string | null;
  profileSummary: string | null;
};

export async function getUserAgentContext(
  userId: string
): Promise<UserAgentContext> {
  const [user] = await db
    .select({
      name: users.name,
      profileSummary: users.profileSummary,
    })
    .from(users)
    .where(eq(users.id, userId));
  return {
    name: user?.name?.trim() || null,
    profileSummary: user?.profileSummary?.trim() || null,
  };
}

export async function getRecentContextMessages(sessionId: string) {
  const dbMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.createdAt))
    .limit(MAX_CONTEXT_MESSAGES);

  return dbMessages.reverse().map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));
}

export function buildSessionSystemContent(
  session: Session,
  basePrompt: string,
  extraNotes?: string,
  profileSummary?: string | null,
  userName?: string | null
): string {
  let systemContent = appendUserIdentityToSystem(basePrompt, userName);
  systemContent = appendUserProfileToSystem(systemContent, profileSummary);
  systemContent = appendSummaryToSystem(systemContent, session);
  if (session.cvContent) {
    systemContent += `\n\n## Uploaded CV Content\nThe user uploaded the following CV:\n\n${session.cvContent}`;
  }
  if (session.targetRole) {
    systemContent += `\n\n## Target Role\nThe user is targeting: ${session.targetRole}`;
  }
  if (session.cvLanguage) {
    systemContent += `\n\n## CV Language\nThe user wants the CV written in: ${session.cvLanguage}`;
  }
  if (extraNotes) {
    systemContent += `\n\n${extraNotes}`;
  }
  return systemContent;
}

async function logSummaryUsage(
  sessionId: string,
  userId: string,
  usage: { inputTokens?: number; outputTokens?: number } | undefined
): Promise<void> {
  if (!usage) return;
  const modelConfig = getModelConfig(SUMMARY_MODEL);
  const inTok = usage.inputTokens ?? 0;
  const outTok = usage.outputTokens ?? 0;
  const costCents = Math.ceil(
    (inTok * modelConfig.inputPricePerMToken +
      outTok * modelConfig.outputPricePerMToken) /
      10000
  );
  await db.insert(usageLogs).values({
    sessionId,
    userId,
    model: SUMMARY_MODEL,
    inputTokens: inTok,
    outputTokens: outTok,
    costCents,
  });
}

export async function maybeUpdateConversationSummary(
  sessionId: string,
  userId: string
): Promise<void> {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) return;

    const [{ count: totalRaw }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.sessionId, sessionId));

    const total = totalRaw ?? 0;
    const targetCount = total - MAX_CONTEXT_MESSAGES;

    if (targetCount <= 0 || targetCount <= session.summaryUpToCount) return;

    const pendingCount = targetCount - session.summaryUpToCount;
    if (pendingCount < SUMMARY_INTERVAL) return;

    const newMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .offset(session.summaryUpToCount)
      .limit(pendingCount);

    if (newMessages.length === 0) return;

    const transcript = newMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");

    const userContent = session.conversationSummary?.trim()
      ? `Previous summary:\n${session.conversationSummary.trim()}\n\nNew messages to merge:\n${transcript}`
      : `Messages to summarize:\n${transcript}`;

    const result = await generateText({
      model: gateway(SUMMARY_MODEL),
      system: SUMMARY_PROMPT,
      prompt: userContent,
      providerOptions: {
        gateway: {
          user: userId,
          tags: [`model:${SUMMARY_MODEL}`, "feature:summary"],
        },
      },
    });

    const summary = result.text?.trim();
    if (!summary) return;

    await db
      .update(sessions)
      .set({
        conversationSummary: summary,
        summaryUpToCount: targetCount,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    await logSummaryUsage(sessionId, userId, result.usage);
  } catch (err) {
    console.error("[conversation-summary] failed to update summary:", err);
  }
}

async function buildSessionTranscript(
  session: Session
): Promise<string | null> {
  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, session.id))
    .orderBy(asc(messages.createdAt));

  if (allMessages.length === 0) return null;

  const recentPart =
    session.summaryUpToCount > 0
      ? allMessages.slice(session.summaryUpToCount)
      : allMessages;

  const parts: string[] = [];
  if (session.conversationSummary?.trim()) {
    parts.push(`Earlier conversation:\n${session.conversationSummary.trim()}`);
  }
  if (recentPart.length > 0) {
    parts.push(
      recentPart.map((m) => `${m.role}: ${m.content}`).join("\n\n")
    );
  }

  const metadata: string[] = [];
  if (session.targetRole) metadata.push(`Target role: ${session.targetRole}`);
  if (session.cvLanguage) metadata.push(`CV language: ${session.cvLanguage}`);
  if (session.generatedCv) metadata.push("A CV draft was generated in this session.");
  if (metadata.length > 0) {
    parts.unshift(`Session metadata:\n${metadata.join("\n")}`);
  }

  return parts.join("\n\n");
}

export async function maybeUpdateSessionSummary(
  sessionId: string,
  userId: string,
  options?: { force?: boolean }
): Promise<boolean> {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) return false;

    const [{ count: userMsgCountRaw }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(eq(messages.sessionId, sessionId), eq(messages.role, "user"))
      );

    const userMsgCount = userMsgCountRaw ?? 0;
    if (userMsgCount < SESSION_SUMMARY_MIN_USER_MESSAGES) return false;

    const pendingUserMsgs =
      userMsgCount - session.sessionSummaryUserMsgCount;
    if (
      !options?.force &&
      session.sessionSummary &&
      pendingUserMsgs < SESSION_SUMMARY_UPDATE_INTERVAL
    ) {
      return false;
    }

    const transcript = await buildSessionTranscript(session);
    if (!transcript) return false;

    const userContent = session.sessionSummary?.trim()
      ? `Previous session summary:\n${session.sessionSummary.trim()}\n\nUpdated conversation:\n${transcript}`
      : `Conversation to summarize:\n${transcript}`;

    const result = await generateText({
      model: gateway(SUMMARY_MODEL),
      system: SESSION_SUMMARY_PROMPT,
      prompt: userContent,
      providerOptions: {
        gateway: {
          user: userId,
          tags: [`model:${SUMMARY_MODEL}`, "feature:session-summary"],
        },
      },
    });

    const summary = result.text?.trim();
    if (!summary) return false;

    await db
      .update(sessions)
      .set({
        sessionSummary: summary,
        sessionSummaryUserMsgCount: userMsgCount,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    await logSummaryUsage(sessionId, userId, result.usage);
    return true;
  } catch (err) {
    console.error("[session-summary] failed to update:", err);
    return false;
  }
}

export async function maybeUpdateUserProfileSummary(
  userId: string
): Promise<void> {
  try {
    const pastSessions = await db
      .select({
        sessionSummary: sessions.sessionSummary,
        title: sessions.title,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNotNull(sessions.sessionSummary)
        )
      )
      .orderBy(desc(sessions.updatedAt))
      .limit(MAX_SESSIONS_IN_PROFILE);

    if (pastSessions.length === 0) return;

    const [user] = await db
      .select({ profileSummary: users.profileSummary })
      .from(users)
      .where(eq(users.id, userId));

    const sessionBlock = pastSessions
      .map(
        (s, i) =>
          `Session ${i + 1} (${s.title}, ${s.updatedAt.toISOString().slice(0, 10)}):\n${s.sessionSummary}`
      )
      .join("\n\n");

    const userContent = user?.profileSummary?.trim()
      ? `Current user profile:\n${user.profileSummary.trim()}\n\nSession summaries to merge:\n${sessionBlock}`
      : `Session summaries to merge into a user profile:\n${sessionBlock}`;

    const result = await generateText({
      model: gateway(SUMMARY_MODEL),
      system: USER_PROFILE_PROMPT,
      prompt: userContent,
      providerOptions: {
        gateway: {
          user: userId,
          tags: [`model:${SUMMARY_MODEL}`, "feature:user-profile"],
        },
      },
    });

    const profile = result.text?.trim();
    if (!profile) return;

    await db
      .update(users)
      .set({ profileSummary: profile })
      .where(eq(users.id, userId));

    const [latestSession] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.updatedAt))
      .limit(1);

    if (latestSession && result.usage) {
      await logSummaryUsage(latestSession.id, userId, result.usage);
    }
  } catch (err) {
    console.error("[user-profile] failed to update:", err);
  }
}

/** Update session summary and propagate to user profile when needed. */
export async function updateCrossSessionMemory(
  sessionId: string,
  userId: string,
  options?: { forceSessionSummary?: boolean }
): Promise<void> {
  const updated = await maybeUpdateSessionSummary(
    sessionId,
    userId,
    { force: options?.forceSessionSummary }
  );
  if (updated || options?.forceSessionSummary) {
    await maybeUpdateUserProfileSummary(userId);
  }
}

/** Clear all cross-session memory for a user (admin action). */
export async function clearCrossSessionMemory(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ profileSummary: null })
    .where(eq(users.id, userId));

  await db
    .update(sessions)
    .set({
      sessionSummary: null,
      sessionSummaryUserMsgCount: 0,
    })
    .where(eq(sessions.userId, userId));
}
