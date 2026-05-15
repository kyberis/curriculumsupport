import { db } from "@/lib/db";
import { sessions, messages, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string; sessionId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const { userId, sessionId } = await params;

  const [row] = await db
    .select({
      session: sessions,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

  if (!row) {
    return new Response("Session not found", { status: 404 });
  }

  const sessionMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));

  const { cvContent, generatedCv, ...sessionPublic } = row.session;

  let userMessages = 0;
  let assistantMessages = 0;
  let systemMessages = 0;
  for (const m of sessionMessages) {
    if (m.role === "user") userMessages += 1;
    else if (m.role === "assistant") assistantMessages += 1;
    else systemMessages += 1;
  }

  return NextResponse.json({
    session: sessionPublic,
    messages: sessionMessages,
    owner: {
      id: userId,
      name: row.ownerName,
      email: row.ownerEmail,
    },
    meta: {
      messageCount: sessionMessages.length,
      userMessageCount: userMessages,
      assistantMessageCount: assistantMessages,
      systemMessageCount: systemMessages,
      hasCvContent: Boolean(cvContent),
      cvContentChars: cvContent?.length ?? 0,
      hasGeneratedCv: Boolean(generatedCv),
      generatedCvChars: generatedCv?.length ?? 0,
    },
  });
}
