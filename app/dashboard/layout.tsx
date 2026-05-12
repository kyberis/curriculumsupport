import Link from "next/link";
import { auth, signOut } from "@/lib/auth-config";
import { siteConfig } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";

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
    </div>
  );
}
