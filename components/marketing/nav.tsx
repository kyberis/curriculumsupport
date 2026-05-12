import Link from "next/link";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/marketing-content";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl text-neutral-100">
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-neutral-300 hover:text-white"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-amber-600 text-white hover:bg-amber-500">
                Get started
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button className="bg-amber-600 text-white hover:bg-amber-500">
                Dashboard
              </Button>
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}
