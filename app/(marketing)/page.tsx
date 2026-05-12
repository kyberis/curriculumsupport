import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoChat } from "@/components/marketing/demo-chat";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { heroContent, steps } from "@/lib/marketing-content";

export default function HomePage() {
  return (
    <>
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
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-amber-600 px-8 text-base text-white hover:bg-amber-500"
              >
                {heroContent.cta}
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-amber-600 px-8 text-base text-white hover:bg-amber-500"
              >
                Go to dashboard
              </Button>
            </Link>
          </Show>
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
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-amber-600 px-8 text-base text-white hover:bg-amber-500"
              >
                Get started — free
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-amber-600 px-8 text-base text-white hover:bg-amber-500"
              >
                Go to dashboard
              </Button>
            </Link>
          </Show>
        </div>
      </section>
    </>
  );
}
