import { streamText, stepCountIs, gateway, type UIMessage } from "ai";
import { db } from "@/lib/db";
import { messages, sessions, usageLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CV_SYSTEM_PROMPT } from "@/lib/agent";
import { getModelConfig } from "@/lib/model";
import { checkMessageLimit } from "@/lib/rate-limits";
import { agentTools } from "@/lib/tools";
import { getUserId } from "@/lib/auth";
import {
  buildSessionSystemContent,
  getRecentContextMessages,
  maybeUpdateConversationSummary,
} from "@/lib/conversation-summary";

function extractTextFromParts(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export async function POST(req: Request) {
  const userId = await getUserId();

  const body = await req.json();
  const { messages: uiMessages, sessionId } = body as {
    messages: UIMessage[];
    sessionId: string;
  };

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const modelConfig = getModelConfig(session.model);

  const { allowed, remaining } = await checkMessageLimit(
    userId,
    modelConfig.dailyMessageLimit
  );
  if (!allowed) {
    return Response.json(
      { error: "Daily message limit reached. Try again tomorrow.", remaining },
      { status: 429 }
    );
  }

  const lastUserMessage = uiMessages[uiMessages.length - 1];
  if (lastUserMessage?.role === "user") {
    const text = extractTextFromParts(lastUserMessage);
    if (text) {
      await db.insert(messages).values({
        sessionId,
        role: "user",
        content: text,
      });
    }
  }

  const dbMessages = await getRecentContextMessages(sessionId);
  const systemContent = buildSessionSystemContent(session, CV_SYSTEM_PROMPT);

  const result = streamText({
    model: gateway(session.model),
    system: systemContent,
    messages: dbMessages,
    tools: agentTools,
    stopWhen: stepCountIs(5),
    providerOptions: {
      gateway: {
        user: userId,
        tags: [`model:${session.model}`, "feature:chat"],
      },
    },
    async onFinish({ text, steps, usage }) {
      if (!text) return;

      await db.insert(messages).values({
        sessionId,
        role: "assistant",
        content: text,
      });

      const updates: Record<string, unknown> = { updatedAt: new Date() };

      for (const step of steps) {
        for (const call of step.toolCalls) {
          if (call.toolName === "setCvLanguage") {
            const input = call.input as { language?: string };
            if (input.language) {
              updates.cvLanguage = input.language;
            }
          }
        }
      }

      if (text.includes("# ") && text.includes("## Experience")) {
        updates.generatedCv = text;
      }

      if (Object.keys(updates).length > 1) {
        await db
          .update(sessions)
          .set(updates)
          .where(eq(sessions.id, sessionId));
      }

      if (usage) {
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
          model: session.model,
          inputTokens: inTok,
          outputTokens: outTok,
          costCents,
        });
      }

      await maybeUpdateConversationSummary(sessionId, userId);
    },
  });

  return result.toUIMessageStreamResponse();
}
