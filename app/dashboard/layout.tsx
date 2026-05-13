import Link from "next/link";
import { auth, signOut } from "@/lib/auth-config";
import { siteConfig } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";
import { Settings, Heart, Shield } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117]">
      <header className="border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="font-serif text-xl text-neutral-100"
          >
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-3">
            {session?.user?.role === "admin" && (
              <Link
                href="/dashboard/admin"
                className="flex h-8 w-8 items-center justify-center rounded-full text-amber-400/70 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                title="Admin"
              >
                <Shield className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Link>
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-white/5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-6">
          <Link
            href="/dashboard/donate"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 transition-colors hover:text-neutral-400"
          >
            <Heart className="h-3 w-3" />
            Support this project
          </Link>
        </div>
      </footer>
    </div>
  );
}
