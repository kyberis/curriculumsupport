import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { checkSessionLimit } from "@/lib/rate-limits";

export async function GET() {
  const userId = await getUserId();

  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));

  return NextResponse.json(userSessions);
}

export async function POST(req: Request) {
  const userId = await getUserId();

  const { allowed, remaining } = await checkSessionLimit(userId);
  if (!allowed) {
    return Response.json(
      { error: "Daily session limit reached. Try again tomorrow.", remaining },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const title = body.title || "New CV Session";

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      title,
    })
    .returning();

  await db.insert(messages).values({
    sessionId: session.id,
    role: "assistant",
    content:
      "Hello! I'm your CV writing assistant. Let's build a great CV together.\n\nWhat role are you applying for? Please share the job title, seniority level, and the industry or company if you have one in mind.",
  });

  return NextResponse.json(session, { status: 201 });
}
