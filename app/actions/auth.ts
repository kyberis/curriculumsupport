"use server";

import { signIn } from "@/lib/auth-config";

function safeRedirectTo(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  return raw;
}

export async function signInWithGoogle(formData: FormData) {
  const raw = formData.get("redirectTo");
  const redirectTo = safeRedirectTo(raw);
  // #region agent log
  await fetch(
    "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "e5ec84",
      },
      body: JSON.stringify({
        sessionId: "e5ec84",
        hypothesisId: "H4",
        location: "app/actions/auth.ts:signInWithGoogle",
        message: "signInWithGoogle invoked",
        data: { redirectTo },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }
  ).catch(() => {});
  // #endregion
  try {
    await signIn("google", { redirectTo });
    // #region agent log
    await fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H4",
          location: "app/actions/auth.ts:signInWithGoogle",
          message: "signIn completed (returned)",
          data: {},
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    await fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H4",
          location: "app/actions/auth.ts:signInWithGoogle",
          message: "signIn threw",
          data: { err: e instanceof Error ? e.message : String(e) },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
    throw e;
  }
}

