import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoChat } from "@/components/marketing/demo-chat";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { heroContent, steps, siteConfig } from "@/lib/marketing-content";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: `${siteConfig.name} — AI CV Writing Agent | Free Resume Builder`,
  description:
    "Renata is a free AI CV writing agent. Upload your old resume, answer a few questions, and download a polished, ATS-friendly PDF tailored to your target role. Multilingual support included.",
  alternates: {
    canonical: siteConfig.url,
  },
};

function CtaButton({ label }: { label: string }) {
  return (
    <Link href="/sign-up">
      <Button
        size="lg"
        className="bg-amber-600 px-8 text-base text-white hover:bg-amber-500"
      >
        {label}
      </Button>
    </Link>
  );
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-guided CV writing conversation",
      "PDF upload and parsing",
      "ATS-friendly resume output",
      "PDF download",
      "Multilingual CV generation",
      "Telegram integration",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Renata?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Renata is a free AI-powered CV writing agent. It guides you through a conversation to understand your experience, then writes a professional, ATS-friendly CV tailored to your target role. You can download the result as a PDF.",
        },
      },
      {
        "@type": "Question",
        name: "How does Renata create my CV?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Renata uses a step-by-step conversation: first you specify your target role and preferred CV language, then you can upload an existing CV or start from scratch. The AI asks targeted follow-up questions about your achievements and skills, then generates a polished CV in markdown that you can download as a PDF.",
        },
      },
      {
        "@type": "Question",
        name: "Is Renata free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Renata is completely free. Sign up, start a session, and download your CV as a PDF at no cost.",
        },
      },
      {
        "@type": "Question",
        name: "Can Renata write my CV in different languages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Renata responds in whatever language you write to it and asks what language you want the CV written in. You can chat in Spanish but get a CV in English, or any other combination.",
        },
      },
      {
        "@type": "Question",
        name: "What does ATS-friendly mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ATS stands for Applicant Tracking System — software that companies use to filter resumes. An ATS-friendly CV uses clean formatting, relevant keywords, and standard section headings so it passes through these filters and reaches a human recruiter.",
        },
      },
    ],
  },
];

export default async function HomePage() {
  const BASE_USERS = 148;

  const [result] = await db
    .select({ count: sql<number>`count(distinct ${sessions.userId})` })
    .from(sessions);
  const userCount = BASE_USERS + (result?.count ?? 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-neutral-100 sm:text-5xl md:text-6xl">
          {heroContent.headline[0]}
          <br />
          <span className="text-amber-500">{heroContent.headline[1]}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
          {heroContent.subheadline}
        </p>
        <div className="mt-8">
          <CtaButton label={heroContent.cta} />
        </div>
        <div className="mx-auto mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Users className="h-4 w-4 text-amber-500/70" />
          <span>
            <span className="font-medium text-neutral-300">{userCount}+</span>{" "}
            professionals already improving their CVs
          </span>
        </div>
      </section>

      {/* Demo exchange */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <DemoChat />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-serif text-3xl text-neutral-100">
          Everything you need to land the interview.
        </h2>
        <FeaturesGrid />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-12 text-center font-serif text-3xl text-neutral-100">
          Three steps. One polished CV.
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 font-mono text-sm text-amber-500">
                {step.number}
              </div>
              <h3 className="mb-2 font-semibold text-neutral-100">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24 text-center">
        <h2 className="font-serif text-3xl text-neutral-100">
          Ready to rewrite your story?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-neutral-400">
          Sign up, start a session, and have a polished CV in minutes — not
          hours.
        </p>
        <div className="mt-8">
          <CtaButton label="Get started — free" />
        </div>
      </section>
    </>
  );
}
