import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { clearCrossSessionMemory } from "@/lib/conversation-summary";

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

  const [user] = await db
    .select({
      profileSummary: users.profileSummary,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const userSessions = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      sessionSummary: sessions.sessionSummary,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.updatedAt));

  const sessionsWithSummary = userSessions.filter((s) =>
    s.sessionSummary?.trim()
  );

  return NextResponse.json({
    profileSummary: user.profileSummary?.trim() || null,
    sessionSummaries: sessionsWithSummary.map((s) => ({
      id: s.id,
      title: s.title,
      sessionSummary: s.sessionSummary,
      updatedAt: s.updatedAt,
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const { userId } = await params;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  await clearCrossSessionMemory(userId);

  return NextResponse.json({ ok: true });
}
