import { tool } from "ai";
import { z } from "zod";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
  answer?: string;
}

export const webSearch = tool({
  description:
    "Search the web for real-time information about a company, industry, job role, skills in demand, or any topic relevant to building a better CV. Use this when the user mentions a specific company, role, or when you need current data to tailor the CV. Results include source URLs — cite them when stating facts.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query. Be specific — e.g. 'Google software engineer job requirements 2025' or 'Tesla company culture and values'."
      ),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { error: "Search is not configured.", results: [], sources: [] };
    }

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: 5,
          include_answer: true,
        }),
      });

      if (!res.ok) {
        return { error: "Search request failed.", results: [], sources: [] };
      }

      const data: TavilyResponse = await res.json();
      const results: { title: string; snippet: string; url: string }[] = [];

      if (data.results) {
        for (const item of data.results) {
          results.push({
            title: item.title,
            snippet: item.content,
            url: item.url,
          });
        }
      }

      const sources = results
        .filter((r) => r.url)
        .map((r) => ({ title: r.title, url: r.url }));

      return {
        query,
        synthesis: data.answer?.trim() || undefined,
        results,
        sources,
        citationHint:
          "Cite facts with markdown links to entries in `sources`. Add a Fuentes/Sources section at the end of your reply listing every URL used.",
      };
    } catch {
      return { error: "Search failed unexpectedly.", results: [], sources: [] };
    }
  },
});
