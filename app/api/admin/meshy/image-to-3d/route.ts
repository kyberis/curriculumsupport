import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { meshyCreateImageTo3d } from "@/lib/meshy";

export const maxDuration = 60;

async function defaultAvatarDataUri(): Promise<string> {
  const filePath = path.join(process.cwd(), "public", "renata-avatar.png");
  const buf = await readFile(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * Admin-only: start Meshy image-to-3d from the default Renata avatar (base64)
 * or from an optional public image_url in the body.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.MESHY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "MESHY_API_KEY no está configurada. Añádela en .env.local (cuenta Meshy → API key).",
      },
      { status: 503 }
    );
  }

  let image_url: string;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      image_url?: string;
    };
    image_url =
      typeof body.image_url === "string" && body.image_url.length > 0
        ? body.image_url
        : await defaultAvatarDataUri();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Imagen no válida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { taskId } = await meshyCreateImageTo3d(apiKey, {
      image_url,
      ai_model: "meshy-5",
      should_texture: true,
      target_formats: ["glb"],
      model_type: "standard",
    });
    return NextResponse.json({ taskId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error Meshy";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
