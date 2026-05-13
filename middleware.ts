import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

const publicApiPaths = ["/api/telegram/webhook"];
const protectedPaths = ["/dashboard", "/session", "/api/chat", "/api/sessions", "/api/parse-cv", "/api/settings", "/api/admin"];
const adminPaths = ["/dashboard/admin", "/api/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicApi = publicApiPaths.some((p) => pathname.startsWith(p));
  if (isPublicApi) return NextResponse.next();

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  if (isAdmin && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
