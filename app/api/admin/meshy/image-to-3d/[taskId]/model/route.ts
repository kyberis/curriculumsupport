import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { meshyGetImageTo3dTask } from "@/lib/meshy";

/**
 * Streams the Meshy GLB through our origin so <model-viewer> can load it
 * without browser CORS blocking assets.meshy.ai.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.MESHY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "MESHY_API_KEY no está configurada." },
      { status: 503 }
    );
  }

  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Falta taskId" }, { status: 400 });
  }

  let task;
  try {
    task = await meshyGetImageTo3dTask(apiKey, taskId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error Meshy";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (task.status !== "SUCCEEDED") {
    return NextResponse.json(
      { error: "El modelo aún no está listo." },
      { status: 409 }
    );
  }

  const glbUrl = task.model_urls?.glb;
  if (!glbUrl) {
    return NextResponse.json(
      { error: "Meshy no devolvió URL del modelo." },
      { status: 404 }
    );
  }

  const meshyRes = await fetch(glbUrl);
  if (!meshyRes.ok) {
    return NextResponse.json(
      { error: `No se pudo descargar el GLB (${meshyRes.status}).` },
      { status: 502 }
    );
  }

  if (!meshyRes.body) {
    return NextResponse.json(
      { error: "Respuesta vacía del CDN." },
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "model/gltf-binary");
  headers.set("Cache-Control", "private, no-store");

  const len = meshyRes.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new NextResponse(meshyRes.body, { status: 200, headers });
}
