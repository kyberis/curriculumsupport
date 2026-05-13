import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.authSessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Google({
      checks: ["state"],
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: "user" | "admin" }).role ?? "user";
      return session;
    },
  },
});
