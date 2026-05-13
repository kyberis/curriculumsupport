import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      emailVerified: users.emailVerified,
      sessionCount: sql<number>`count(${sessions.id})::int`,
      lastSessionAt: sql<string | null>`max(${sessions.createdAt})`,
    })
    .from(users)
    .leftJoin(sessions, eq(users.id, sessions.userId))
    .groupBy(users.id)
    .orderBy(desc(users.emailVerified));

  return NextResponse.json(result);
}
