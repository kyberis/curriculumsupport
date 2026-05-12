import { tool } from "ai";
import { z } from "zod";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
  organic?: SerperResult[];
}

export const webSearch = tool({
  description:
    "Search Google for real-time information about a company, industry, job role, skills in demand, or any topic relevant to building a better CV. Use this when the user mentions a specific company, role, or when you need current data to tailor the CV.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The search query. Be specific — e.g. 'Google software engineer job requirements 2025' or 'Tesla company culture and values'."
      ),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return {
        error: "Search is not configured.",
        results: [],
      };
    }

    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (!res.ok) {
        return { error: "Search request failed.", results: [] };
      }

      const data: SerperResponse = await res.json();
      const results: { title: string; snippet: string; url: string }[] = [];

      if (data.knowledgeGraph) {
        const kg = data.knowledgeGraph;
        results.push({
          title: kg.title ?? "Knowledge Graph",
          snippet: [
            kg.type,
            kg.description,
            kg.attributes
              ? Object.entries(kg.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("; ")
              : null,
          ]
            .filter(Boolean)
            .join(" — "),
          url: "",
        });
      }

      if (data.organic) {
        for (const item of data.organic) {
          results.push({
            title: item.title,
            snippet: item.snippet,
            url: item.link,
          });
        }
      }

      return { results };
    } catch {
      return { error: "Search failed unexpectedly.", results: [] };
    }
  },
});
