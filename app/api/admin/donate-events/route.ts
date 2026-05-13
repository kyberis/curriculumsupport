import { db } from "@/lib/db";
import { donateEvents } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db
    .select({
      eventType: donateEvents.eventType,
      count: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${donateEvents.userId})::int`,
    })
    .from(donateEvents)
    .groupBy(donateEvents.eventType);

  const stats = {
    views: 0,
    viewsUnique: 0,
    clicksDonate: 0,
    clicksDonateUnique: 0,
    clicksCrypto: 0,
    clicksCryptoUnique: 0,
    clicksPaypal: 0,
    clicksPaypalUnique: 0,
  };

  for (const row of rows) {
    switch (row.eventType) {
      case "view":
        stats.views = row.count;
        stats.viewsUnique = row.uniqueUsers;
        break;
      case "click_donate":
        stats.clicksDonate = row.count;
        stats.clicksDonateUnique = row.uniqueUsers;
        break;
      case "click_crypto":
        stats.clicksCrypto = row.count;
        stats.clicksCryptoUnique = row.uniqueUsers;
        break;
      case "click_paypal":
        stats.clicksPaypal = row.count;
        stats.clicksPaypalUnique = row.uniqueUsers;
        break;
    }
  }

  return NextResponse.json(stats);
}
