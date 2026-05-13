import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

const publicApiPaths = ["/api/telegram/webhook", "/api/donate-events"];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/") return true;
  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) return true;
  if (pathname === "/sign-out") return true;
  if (pathname === "/sign-up" || pathname.startsWith("/sign-up/")) return true;
  if (pathname === "/terms") return true;
  if (pathname === "/privacy") return true;
  return false;
}

const adminPaths = ["/dashboard/admin", "/api/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.includes("/api/auth/callback")) {
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
          hypothesisId: "H2",
          location: "middleware.ts:api/auth/callback",
          message: "middleware saw OAuth callback path",
          data: {
            pathname,
            hasAuth: Boolean(req.auth?.user?.id),
          },
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
    // #endregion
  }

  if (pathname === "/") {
    // #region agent log
    void fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H5",
          location: "middleware.ts",
          message: "middleware processed /",
          data: { hasAuth: Boolean(req.auth?.user?.id) },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
  }

  const isPublicApi = publicApiPaths.some((p) => pathname.startsWith(p));
  if (isPublicApi) return NextResponse.next();

  if (isPublicPath(pathname)) return NextResponse.next();

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  if (isAdmin && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
