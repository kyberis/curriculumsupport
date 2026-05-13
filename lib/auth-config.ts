import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Database adapter persists users/accounts; session must be JWT so Edge middleware
  // can validate auth without postgres (DB sessions require Node).
  session: { strategy: "jwt" },
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.authSessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    // Do not pass checks: ["state"] alone — that replaces the default ["pkce"] and breaks OIDC.
    Google({}),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user, account }) {
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
            hypothesisId: "H3",
            location: "lib/auth-config.ts:signIn",
            message: "callbacks.signIn ran (OAuth + user linking step reached)",
            data: {
              provider: account?.provider ?? null,
              hasUserId: Boolean(user?.id),
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      return true;
    },
    jwt({ token, user }) {
      if (user) {
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
              hypothesisId: "H4",
              location: "lib/auth-config.ts:jwt",
              message: "jwt callback with new user (session token step)",
              data: { hasSub: Boolean(user.id) },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
        token.role = user.role ?? "user";
      }
      return token;
    },
    session({ session, user, token }) {
      const id = user?.id ?? token.sub;
      if (id) session.user.id = id;
      session.user.role = user?.role ?? token.role ?? "user";
      return session;
    },
  },
});
