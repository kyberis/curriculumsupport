import { db } from "@/lib/db";
import {
  telegramIntegrations,
  telegramLinkCodes,
} from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";
import { generateLinkCode } from "@/lib/telegram";
import { eq } from "drizzle-orm";

export async function GET() {
  const userId = await getUserId();

  const [integration] = await db
    .select()
    .from(telegramIntegrations)
    .where(eq(telegramIntegrations.userId, userId));

  return Response.json({
    connected: !!integration,
    username: integration?.username ?? null,
    firstName: integration?.firstName ?? null,
    linkedAt: integration?.linkedAt ?? null,
  });
}

export async function POST() {
  const userId = await getUserId();

  const [existing] = await db
    .select()
    .from(telegramIntegrations)
    .where(eq(telegramIntegrations.userId, userId));

  if (existing) {
    return Response.json(
      { error: "Telegram already connected" },
      { status: 400 }
    );
  }

  await db
    .delete(telegramLinkCodes)
    .where(eq(telegramLinkCodes.userId, userId));

  const code = generateLinkCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(telegramLinkCodes).values({ userId, code, expiresAt });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "your_bot";

  return Response.json({ code, expiresAt, botUsername });
}

export async function DELETE() {
  const userId = await getUserId();

  await db
    .delete(telegramIntegrations)
    .where(eq(telegramIntegrations.userId, userId));

  return Response.json({ success: true });
}
