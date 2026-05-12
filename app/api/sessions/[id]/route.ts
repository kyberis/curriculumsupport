import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId();
  const { id } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const sessionMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, id))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({ session, messages: sessionMessages });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId();
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
