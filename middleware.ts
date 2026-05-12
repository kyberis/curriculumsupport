import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Clerk auth disabled until real credentials are configured.
  // Re-enable by replacing this file with the clerkMiddleware version
  // once CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are set.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
