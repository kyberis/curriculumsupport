const MAX_CONTENT_CHARS = 60_000;

const LINKEDIN_PROFILE_URL_RE =
  /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|pub)\/[^\s<>"')\],]+/gi;

interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

interface TavilyExtractResponse {
  results?: TavilyExtractResult[];
  failed_results?: { url: string; error: string }[];
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

interface TavilySearchResponse {
  results?: TavilySearchResult[];
  answer?: string;
}

export interface LinkedInFetchResult {
  url: string;
  content: string;
  error?: string;
  hint?: string;
  truncated?: boolean;
  source?: "extract" | "search";
}

/** Strip trailing punctuation common when URLs are pasted from mobile shares. */
export function sanitizeUrlInput(input: string): string {
  return input.trim().replace(/[,;.!?)\]]+$/g, "");
}

export function normalizeLinkedInProfileUrl(input: string): string | null {
  let trimmed = sanitizeUrlInput(input);
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

export function extractLinkedInProfileUrls(text: string): string[] {
  const matches = text.match(LINKEDIN_PROFILE_URL_RE) ?? [];
  const normalized = matches
    .map((match) => normalizeLinkedInProfileUrl(match))
    .filter((url): url is string => Boolean(url));
  return [...new Set(normalized)];
}

function truncateContent(raw: string): { content: string; truncated: boolean } {
  const truncated = raw.length > MAX_CONTENT_CHARS;
  const content = truncated
    ? `${raw.slice(0, MAX_CONTENT_CHARS)}\n\n[...truncated]`
    : raw;
  return { content, truncated };
}

async function fetchViaExtract(
  normalized: string,
  apiKey: string
): Promise<string | null> {
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

  if (!res.ok) return null;

  const data: TavilyExtractResponse = await res.json();
  const failed = data.failed_results?.find((f) => f.url === normalized);
  if (failed) return null;

  return data.results?.[0]?.raw_content?.trim() ?? null;
}

async function fetchViaSearch(
  normalized: string,
  apiKey: string
): Promise<string | null> {
  const slug = normalized.split("/").filter(Boolean).pop();
  if (!slug) return null;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: `site:linkedin.com/in/${slug} OR ${normalized}`,
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!res.ok) return null;

  const data: TavilySearchResponse = await res.json();
  const parts: string[] = [];

  if (data.answer?.trim()) {
    parts.push(data.answer.trim());
  }

  for (const item of data.results ?? []) {
    if (!item.content?.trim()) continue;
    if (!item.url.includes("linkedin.com/in/")) continue;
    parts.push(`### ${item.title}\n${item.content.trim()}`);
  }

  const combined = parts.join("\n\n").trim();
  return combined || null;
}

export async function fetchLinkedInProfileContent(
  url: string
): Promise<LinkedInFetchResult> {
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
    let raw = await fetchViaExtract(normalized, apiKey);
    let source: LinkedInFetchResult["source"] = "extract";

    if (!raw) {
      raw = await fetchViaSearch(normalized, apiKey);
      source = "search";
    }

    if (!raw) {
      return {
        error: "No public content could be read from this URL.",
        url: normalized,
        content: "",
        hint:
          "LinkedIn often requires sign-in for automated fetchers. Ask the user to paste profile text, use a LinkedIn PDF export, or upload a CV.",
      };
    }

    const { content, truncated } = truncateContent(raw);
      return {
        url: normalized,
        content,
        truncated,
        source,
        sourceUrl: normalized,
        citationHint: `Cite this profile inline as [LinkedIn](${normalized}) or similar when stating facts from it.`,
      };
  } catch {
    return {
      error: "Profile fetch failed unexpectedly.",
      url: normalized,
      content: "",
    };
  }
}

export async function buildLinkedInContextFromMessage(
  text: string
): Promise<string | undefined> {
  const urls = extractLinkedInProfileUrls(text);
  if (urls.length === 0) return undefined;

  const result = await fetchLinkedInProfileContent(urls[0]);
  if (result.content) {
    const via =
      result.source === "search" ? " (via web search fallback)" : "";
    return `## LinkedIn profile fetched${via}
The user shared ${result.url}. Use the following public profile text as source material.
When stating facts from this profile, cite inline: [LinkedIn — profile](${result.url})

${result.content}`;
  }

  return `## LinkedIn profile fetch failed
The user shared ${result.url}. ${result.error ?? "Could not read public content."} ${result.hint ?? "Ask them to paste their experience, upload a PDF, or share a LinkedIn PDF export."}`;
}
