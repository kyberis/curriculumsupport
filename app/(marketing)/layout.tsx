import { Nav } from "@/components/marketing/nav";
import { siteConfig } from "@/lib/marketing-content";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117]">
      <Nav />
      <main className="flex-1 pt-16">{children}</main>
      <footer className="border-t border-white/10 bg-[#0d1117]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-serif text-sm text-neutral-500">
            {siteConfig.name} — {siteConfig.tagline}
          </p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <Link href="/terms" className="hover:text-neutral-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-neutral-300">
              Privacy
            </Link>
            <a
              href="https://github.com/kyberis/curriculumsupport"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
