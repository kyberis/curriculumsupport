import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const { userId } = await params;

  const userSessions = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      targetRole: sessions.targetRole,
      status: sessions.status,
      cvLanguage: sessions.cvLanguage,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      messageCount: sql<number>`count(${messages.id})::int`,
    })
    .from(sessions)
    .leftJoin(messages, eq(sessions.id, messages.sessionId))
    .where(eq(sessions.userId, userId))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.createdAt));

  return NextResponse.json(userSessions);
}
