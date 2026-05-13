import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth-config";

function debugAuthRequest(
  method: string,
  req: NextRequest,
  hypothesisId: string,
  message: string
) {
  const url = new URL(req.url);
  const isAuthProbe =
    url.pathname.includes("/callback/") ||
    url.pathname.endsWith("/signin") ||
    url.pathname.includes("/auth/error");
  if (!isAuthProbe) return;

  const oauthError = url.searchParams.get("error");
  const oauthErrDesc = url.searchParams.get("error_description");
  const authHostHint =
    url.pathname.includes("/callback/") ||
    url.pathname.includes("/auth/error");

  // #region agent log
  void fetch(
    "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "ef09fe",
      },
      body: JSON.stringify({
        sessionId: "ef09fe",
        runId: "debug-callback",
        hypothesisId,
        location: `app/api/auth/[...nextauth]/route.ts:${method}`,
        message,
        data: {
          pathname: url.pathname,
          hasCode: url.searchParams.has("code"),
          oauthError: oauthError ?? null,
          oauthErrorDescLen: oauthErrDesc ? oauthErrDesc.length : 0,
          ...(authHostHint
            ? {
                authUrlSet: Boolean(process.env.AUTH_URL),
                nextAuthUrlSet: Boolean(process.env.NEXTAUTH_URL),
              }
            : {}),
        },
        timestamp: Date.now(),
      }),
    }
  ).catch(() => {});
  // #endregion
}

export async function GET(req: NextRequest) {
  debugAuthRequest(
    "GET",
    req,
    "H1",
    "auth handler request (before dispatch)"
  );
  const res = await handlers.GET(req);
  const loc = res.headers.get("location");
  if (loc) {
    try {
      const u = new URL(loc, req.url);
      if (u.pathname.includes("error") || u.searchParams.has("error")) {
        // #region agent log
        void fetch(
          "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "ef09fe",
            },
            body: JSON.stringify({
              sessionId: "ef09fe",
              runId: "debug-callback",
              hypothesisId: "H1",
              location: "app/api/auth/[...nextauth]/route.ts:GET:response",
              message: "auth handler redirect (possible failure redirect)",
              data: {
                redirectPath: u.pathname,
                errParam: u.searchParams.get("error"),
              },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
      }
    } catch {
      /* ignore malformed Location */
    }
  }
  return res;
}

export async function POST(req: NextRequest) {
  debugAuthRequest(
    "POST",
    req,
    "H1",
    "auth handler POST (before dispatch)"
  );
  const res = await handlers.POST(req);
  const loc = res.headers.get("location");
  if (loc) {
    try {
      const u = new URL(loc, req.url);
      if (u.pathname.includes("error") || u.searchParams.has("error")) {
        // #region agent log
        void fetch(
          "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "ef09fe",
            },
            body: JSON.stringify({
              sessionId: "ef09fe",
              runId: "debug-callback",
              hypothesisId: "H1",
              location: "app/api/auth/[...nextauth]/route.ts:POST:response",
              message: "auth handler POST redirect (possible failure redirect)",
              data: {
                redirectPath: u.pathname,
                errParam: u.searchParams.get("error"),
              },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
      }
    } catch {
      /* ignore */
    }
  }
  return res;
}
