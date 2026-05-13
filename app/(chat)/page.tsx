import type { Metadata } from "next";
import { auth } from "@/lib/auth-config";
import { heroContent, siteConfig } from "@/lib/marketing-content";
import { HomeChatClient } from "@/components/chat/home-chat-client";
import { HomeGoogleSignIn } from "@/components/auth/home-google-sign-in";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: heroContent.subheadline.slice(0, 155),
};

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
      "Easy export to PDF via markdown tools",
      "Multilingual CV generation",
    ],
  },
];

export default async function HomePage() {
  // #region agent log
  await fetch(
    "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "e5ec84",
      },
      body: JSON.stringify({
        sessionId: "e5ec84",
        hypothesisId: "H1",
        location: "app/(chat)/page.tsx:HomePage",
        message: "HomePage render start",
        data: {},
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }
  ).catch(() => {});
  // #endregion
  let authenticated = false;
  try {
    const session = await auth();
    authenticated = Boolean(session?.user?.id);
    // #region agent log
    await fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H1",
          location: "app/(chat)/page.tsx:auth",
          message: "auth() ok",
          data: { authenticated },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    await fetch(
      "http://127.0.0.1:7760/ingest/8c0f0354-03c4-4965-9f49-725411b7d7da",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "e5ec84",
        },
        body: JSON.stringify({
          sessionId: "e5ec84",
          hypothesisId: "H1",
          location: "app/(chat)/page.tsx:auth",
          message: "auth() threw",
          data: { err: e instanceof Error ? e.message : String(e) },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }
    ).catch(() => {});
    // #endregion
    throw e;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeChatClient
        authenticated={authenticated}
        googleCta={<HomeGoogleSignIn />}
      />
    </>
  );
}
