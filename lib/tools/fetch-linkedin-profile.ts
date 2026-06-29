import { tool } from "ai";
import { z } from "zod";
import { fetchLinkedInProfileContent } from "@/lib/linkedin";

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
  execute: async ({ url }) => fetchLinkedInProfileContent(url),
});
