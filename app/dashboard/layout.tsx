import Link from "next/link";
import { siteConfig } from "@/lib/marketing-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117]">
      <header className="border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/dashboard" className="font-serif text-xl text-neutral-100">
            {siteConfig.name}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
