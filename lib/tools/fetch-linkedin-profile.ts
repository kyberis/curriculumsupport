import { tool } from "ai";
import { z } from "zod";

const MAX_CONTENT_CHARS = 60_000;

interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

interface TavilyExtractResponse {
  results?: TavilyExtractResult[];
  failed_results?: { url: string; error: string }[];
}

function normalizeLinkedInProfileUrl(input: string): string | null {
  let trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "linkedin.com") {
    return null;
  }

  const path = url.pathname.toLowerCase();
  if (!path.startsWith("/in/") && !path.startsWith("/pub/")) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  url.hash = "";
  url.search = "";
  return url.toString();
}

export const fetchLinkedInProfile = tool({
  description:
    "Fetch text from a LinkedIn **public** profile URL the user shared (linkedin.com/in/... or linkedin.com/pub/...). Call this when the user pastes their LinkedIn profile link so you can base the CV on what is publicly visible. Do not use for company pages or job posts.",
  inputSchema: z.object({
    url: z
      .string()
      .describe(
        "Full LinkedIn profile URL as provided by the user (e.g. https://www.linkedin.com/in/username)."
      ),
  }),
  execute: async ({ url }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return {
        error:
          "Profile fetch is not configured (missing search credentials). Ask the user to paste their experience as text or upload a PDF.",
        url: url.trim(),
        content: "",
      };
    }

    const normalized = normalizeLinkedInProfileUrl(url);
    if (!normalized) {
      return {
        error:
          "Invalid URL. Only public personal profiles are supported (paths /in/ or /pub/ on linkedin.com).",
        url: url.trim(),
        content: "",
      };
    }

    try {
      const res = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          urls: [normalized],
          extract_depth: "advanced",
          format: "markdown",
        }),
      });

      if (!res.ok) {
        return {
          error:
            "Could not retrieve the profile page. The user may need to paste their CV text or upload a PDF instead.",
          url: normalized,
          content: "",
        };
      }

      const data: TavilyExtractResponse = await res.json();
      const failed = data.failed_results?.find((f) => f.url === normalized);
      if (failed) {
        return {
          error: failed.error,
          url: normalized,
          content: "",
          hint:
            "LinkedIn often shows a login wall to automated fetchers. Ask the user to paste profile text, use a LinkedIn PDF export, or upload a CV.",
        };
      }

      const raw = data.results?.[0]?.raw_content?.trim() ?? "";
      if (!raw) {
        return {
          error: "No public content could be read from this URL.",
          url: normalized,
          content: "",
          hint:
            "If the profile exists but content is empty, LinkedIn may require sign-in to view. Ask for a PDF export or pasted text.",
        };
      }

      const truncated = raw.length > MAX_CONTENT_CHARS;
      const content = truncated ? `${raw.slice(0, MAX_CONTENT_CHARS)}\n\n[...truncated]` : raw;

      return {
        url: normalized,
        content,
        truncated,
      };
    } catch {
      return {
        error: "Profile fetch failed unexpectedly.",
        url: normalized,
        content: "",
      };
    }
  },
});
