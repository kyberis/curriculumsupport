import { streamText, type UIMessage } from "ai";
import { db } from "@/lib/db";
import { messages, sessions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { CV_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from "@/lib/agent";
import { getUserId } from "@/lib/auth";

function extractTextFromParts(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export async function POST(req: Request) {
  const userId = getUserId();

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

  const dbMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.createdAt))
    .limit(MAX_CONTEXT_MESSAGES);

  const contextMessages = dbMessages.reverse().map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  let systemContent = CV_SYSTEM_PROMPT;
  if (session.cvContent) {
    systemContent += `\n\n## Uploaded CV Content\nThe user uploaded the following CV:\n\n${session.cvContent}`;
  }
  if (session.targetRole) {
    systemContent += `\n\n## Target Role\nThe user is targeting: ${session.targetRole}`;
  }

  const result = streamText({
    model: "anthropic/claude-sonnet-4.6",
    system: systemContent,
    messages: contextMessages,
    async onFinish({ text }) {
      await db.insert(messages).values({
        sessionId,
        role: "assistant",
        content: text,
      });

      if (text.includes("# ") && text.includes("## Experience")) {
        await db
          .update(sessions)
          .set({ generatedCv: text, updatedAt: new Date() })
          .where(eq(sessions.id, sessionId));
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
