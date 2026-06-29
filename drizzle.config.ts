import { defineConfig } from "drizzle-kit";
import { getDatabaseUrlUnpooled } from "./lib/db/connection-url";

const url = getDatabaseUrlUnpooled();

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
