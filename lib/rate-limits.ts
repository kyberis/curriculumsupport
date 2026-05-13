import { db } from "@/lib/db";
import { messages, sessions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const MAX_SESSIONS_PER_DAY = 3;

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkMessageLimit(userId: string, dailyLimit: number) {
  const todayStart = startOfTodayUTC();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .innerJoin(sessions, eq(messages.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(messages.role, "user"),
        gte(messages.createdAt, todayStart)
      )
    );

  const used = result?.count ?? 0;
  return {
    allowed: used < dailyLimit,
    remaining: Math.max(0, dailyLimit - used),
  };
}

export async function checkSessionLimit(userId: string) {
  const todayStart = startOfTodayUTC();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.createdAt, todayStart)
      )
    );

  const used = result?.count ?? 0;
  return {
    allowed: used < MAX_SESSIONS_PER_DAY,
    remaining: Math.max(0, MAX_SESSIONS_PER_DAY - used),
  };
}
