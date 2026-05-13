import { db } from "@/lib/db";
import { usageLogs, users } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const [totals] = await db
    .select({
      totalCostCents: sql<number>`coalesce(sum(${usageLogs.costCents}), 0)::int`,
      totalInputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)::int`,
      totalRequests: sql<number>`count(*)::int`,
    })
    .from(usageLogs);

  const byModel = await db
    .select({
      model: usageLogs.model,
      costCents: sql<number>`coalesce(sum(${usageLogs.costCents}), 0)::int`,
      inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)::int`,
      requests: sql<number>`count(*)::int`,
    })
    .from(usageLogs)
    .groupBy(usageLogs.model)
    .orderBy(desc(sql`sum(${usageLogs.costCents})`));

  const byUser = await db
    .select({
      userId: usageLogs.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      costCents: sql<number>`coalesce(sum(${usageLogs.costCents}), 0)::int`,
      inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)::int`,
      requests: sql<number>`count(*)::int`,
    })
    .from(usageLogs)
    .leftJoin(users, eq(usageLogs.userId, users.id))
    .groupBy(usageLogs.userId, users.name, users.email, users.image)
    .orderBy(desc(sql`sum(${usageLogs.costCents})`));

  return NextResponse.json({
    totals,
    byModel,
    byUser,
  });
}
