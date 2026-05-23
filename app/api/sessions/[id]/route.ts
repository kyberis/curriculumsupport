import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, and, desc, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { CHAT_MESSAGES_PAGE_SIZE } from "@/lib/agent";

const MAX_PAGE_SIZE = 100;

function parsePageLimit(raw: string | null): number {
  const parsed = raw ? Number.parseInt(raw, 10) : CHAT_MESSAGES_PAGE_SIZE;
  if (!Number.isFinite(parsed) || parsed < 1) return CHAT_MESSAGES_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parsePageLimit(searchParams.get("limit"));
  const beforeId = searchParams.get("before");

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const messageConditions = [eq(messages.sessionId, id)];

  if (beforeId) {
    const [cursor] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(and(eq(messages.id, beforeId), eq(messages.sessionId, id)));

    if (cursor) {
      messageConditions.push(lt(messages.createdAt, cursor.createdAt));
    }
  }

  const batch = await db
    .select()
    .from(messages)
    .where(and(...messageConditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMoreMessages = batch.length > limit;
  const sessionMessages = batch.slice(0, limit).reverse();

  return NextResponse.json({ session, messages: sessionMessages, hasMoreMessages });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  const { id } = await params;
  const body = await req.json();

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title) updateData.title = body.title;
  if (body.targetRole) updateData.targetRole = body.targetRole;
  if (body.cvContent) updateData.cvContent = body.cvContent;
  if (body.generatedCv) updateData.generatedCv = body.generatedCv;
  if (body.status) updateData.status = body.status;

  const [updated] = await db
    .update(sessions)
    .set(updateData)
    .where(eq(sessions.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  const { id } = await params;

  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  await db.delete(sessions).where(eq(sessions.id, id));

  return new Response(null, { status: 204 });
}
