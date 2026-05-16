import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { textForSpeech } from "@/lib/markdown-to-speech";

export const maxDuration = 60;

/**
 * Authenticated: OpenAI speech → MP3 for client-side lip-sync (AnalyserNode).
 * Requires OPENAI_API_KEY in env.
 */
export async function POST(req: Request) {
  try {
    await getUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY no está configurada. La sincronización con audio usa TTS de OpenAI.",
      },
      { status: 503 }
    );
  }

  let body: { text?: string; voice?: string };
  try {
    body = (await req.json()) as { text?: string; voice?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = typeof body.text === "string" ? body.text : "";
  const spoken = textForSpeech(raw, 4090);
  if (!spoken) {
    return NextResponse.json({ error: "Texto vacío" }, { status: 400 });
  }

  const voice =
    typeof body.voice === "string" && body.voice.length > 0
      ? body.voice
      : "nova";

  const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice,
      input: spoken,
      format: "mp3",
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: errText || `OpenAI ${upstream.status}` },
      { status: 502 }
    );
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
