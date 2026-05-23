import { generateText, gateway } from "ai";
import { db } from "@/lib/db";
import { messages, sessions, usageLogs } from "@/lib/db/schema";
import { MAX_CONTEXT_MESSAGES, SUMMARY_INTERVAL } from "@/lib/agent";
import { getModelConfig } from "@/lib/model";
import { eq, asc, desc, sql } from "drizzle-orm";
import type { Session } from "@/lib/db/schema";

const SUMMARY_MODEL = "google/gemini-2.0-flash" as const;

export const SUMMARY_PROMPT = `You summarize Renata CV coaching conversations for internal continuity.

Produce a concise factual summary in the same language as the conversation. Include only what appears in the messages:
- Target role, seniority, company/industry if mentioned
- CV language preference
- Whether they uploaded a CV, LinkedIn, or started from scratch
- Key facts about the user (name, experience, skills, achievements) they shared
- Job description highlights if shared
- Current workflow step (1–6) and what was decided or skipped
- Gap analysis findings if any
- Whether a CV draft was generated or revised

Do not invent information. Keep under 400 words. Use bullet points.`;

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
  extraNotes?: string
): string {
  let systemContent = appendSummaryToSystem(basePrompt, session);
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

    if (result.usage) {
      const modelConfig = getModelConfig(SUMMARY_MODEL);
      const inTok = result.usage.inputTokens ?? 0;
      const outTok = result.usage.outputTokens ?? 0;
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
  } catch (err) {
    console.error("[conversation-summary] failed to update summary:", err);
  }
}
