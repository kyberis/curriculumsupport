import { tool } from "ai";
import { z } from "zod";

export const setCvLanguage = tool({
  description:
    "Record the user's preferred language for the CV. Call this as soon as the user indicates what language they want the CV written in.",
  parameters: z.object({
    language: z
      .string()
      .describe(
        "The language the user wants the CV written in, e.g. 'Spanish', 'English', 'French', 'Portuguese'."
      ),
  }),
  execute: async ({ language }) => {
    return { language, confirmed: true };
  },
});
