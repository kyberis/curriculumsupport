import { db } from "@/lib/db";
import {
  telegramIntegrations,
  telegramLinkCodes,
  sessions,
  messages,
  usageLogs,
} from "@/lib/db/schema";
import { sendMessage, type TelegramUpdate } from "@/lib/telegram";
import { CV_SYSTEM_PROMPT } from "@/lib/agent";
import { getModelConfig } from "@/lib/model";
import { agentTools } from "@/lib/tools";
import {
  buildSessionSystemContent,
  getRecentContextMessages,
  maybeUpdateConversationSummary,
} from "@/lib/conversation-summary";
import { eq, and, gt, desc } from "drizzle-orm";
import { generateText, stepCountIs, gateway } from "ai";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (WEBHOOK_SECRET) {
    const token = req.headers.get("x-telegram-bot-api-secret-token");
    if (token !== WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const update: TelegramUpdate = await req.json();

  if (!update.message?.text) {
    return Response.json({ ok: true });
  }

  const chatId = String(update.message.chat.id);
  const text = update.message.text;
  const from = update.message.from;

  if (text.startsWith("/start")) {
    const code = text.split(" ")[1]?.trim();
    if (!code) {
      await sendMessage(
        chatId,
        "Welcome to Renata! To link your account, generate a code from the app Settings and send `/start YOUR_CODE`."
      );
      return Response.json({ ok: true });
    }

    const [linkCode] = await db
      .select()
      .from(telegramLinkCodes)
      .where(
        and(
          eq(telegramLinkCodes.code, code.toUpperCase()),
          gt(telegramLinkCodes.expiresAt, new Date())
        )
      );

    if (!linkCode) {
      await sendMessage(chatId, "Invalid or expired code. Please generate a new one from the app.");
      return Response.json({ ok: true });
    }

    const [existingForUser] = await db
      .select()
      .from(telegramIntegrations)
      .where(eq(telegramIntegrations.userId, linkCode.userId));

    if (existingForUser) {
      await db
        .update(telegramIntegrations)
        .set({
          chatId,
          username: from.username ?? null,
          firstName: from.first_name,
          linkedAt: new Date(),
        })
        .where(eq(telegramIntegrations.userId, linkCode.userId));
    } else {
      await db.insert(telegramIntegrations).values({
        userId: linkCode.userId,
        chatId,
        username: from.username ?? null,
        firstName: from.first_name,
      });
    }

    await db
      .delete(telegramLinkCodes)
      .where(eq(telegramLinkCodes.userId, linkCode.userId));

    await sendMessage(
      chatId,
      "Account linked successfully! You can now chat with Renata here. Send any message to start working on your CV."
    );
    return Response.json({ ok: true });
  }

  const [integration] = await db
    .select()
    .from(telegramIntegrations)
    .where(eq(telegramIntegrations.chatId, chatId));

  if (!integration) {
    await sendMessage(
      chatId,
      "Your account is not linked. Go to Settings in the app and connect your Telegram."
    );
    return Response.json({ ok: true });
  }

  const userId = integration.userId;

  let [activeSession] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, "in_progress")
      )
    )
    .orderBy(desc(sessions.updatedAt))
    .limit(1);

  if (!activeSession) {
    [activeSession] = await db
      .insert(sessions)
      .values({
        userId,
        title: "Telegram Session",
      })
      .returning();

    await db.insert(messages).values({
      sessionId: activeSession.id,
      role: "assistant",
      content:
        "Hello! I'm Renata, your AI CV writing assistant. What role are you targeting?",
    });
  }

  await db.insert(messages).values({
    sessionId: activeSession.id,
    role: "user",
    content: text,
  });

  const contextMessages = await getRecentContextMessages(activeSession.id);
  const systemContent = buildSessionSystemContent(
    activeSession,
    CV_SYSTEM_PROMPT,
    "Note: The user is chatting via Telegram. Keep responses concise and avoid very long markdown blocks."
  );

  const modelConfig = getModelConfig(activeSession.model);

  try {
    const result = await generateText({
      model: gateway(activeSession.model),
      system: systemContent,
      messages: contextMessages,
      tools: agentTools,
      stopWhen: stepCountIs(5),
      providerOptions: {
        gateway: {
          user: userId,
          tags: [`model:${activeSession.model}`, "feature:telegram"],
        },
      },
    });

    await db.insert(messages).values({
      sessionId: activeSession.id,
      role: "assistant",
      content: result.text,
    });

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    for (const step of result.steps) {
      for (const call of step.toolCalls) {
        if (call.toolName === "setCvLanguage") {
          const input = call.input as { language?: string };
          if (input.language) {
            updates.cvLanguage = input.language;
          }
        }
      }
    }

    if (result.text.includes("# ") && result.text.includes("## Experience")) {
      updates.generatedCv = result.text;
    }

    await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, activeSession.id));

    if (result.usage) {
      const inTok = result.usage.inputTokens ?? 0;
      const outTok = result.usage.outputTokens ?? 0;
      const costCents = Math.ceil(
        (inTok * modelConfig.inputPricePerMToken +
          outTok * modelConfig.outputPricePerMToken) /
          10000
      );
      await db.insert(usageLogs).values({
        sessionId: activeSession.id,
        userId,
        model: activeSession.model,
        inputTokens: inTok,
        outputTokens: outTok,
        costCents,
      });
    }

    await maybeUpdateConversationSummary(activeSession.id, userId);

    const chunks = splitMessage(result.text, 4000);
    for (const chunk of chunks) {
      await sendMessage(chatId, chunk);
    }
  } catch {
    await sendMessage(
      chatId,
      "Sorry, something went wrong processing your message. Please try again."
    );
  }

  return Response.json({ ok: true });
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}
