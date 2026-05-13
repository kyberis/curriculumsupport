import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/marketing-content";
import { auth } from "@/lib/auth-config";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export async function Nav() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl text-neutral-100">
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-neutral-300 hover:text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </Link>
              <a
                href="/sign-out"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-neutral-400 hover:text-white"
                )}
              >
                Sign out
              </a>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="text-neutral-300 hover:text-white"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-amber-600 text-white hover:bg-amber-500">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
