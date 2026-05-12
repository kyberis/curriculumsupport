import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/marketing-content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/session/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "Amazonbot",
          "ClaudeBot",
          "anthropic-ai",
          "Bytespider",
          "CCBot",
          "cohere-ai",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/dashboard/", "/session/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
