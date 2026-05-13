import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Load .env.local into process.env (Node does not do this for migrate.mjs). */
function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  console.log(
    "⏭️  Skipping migration — set DATABASE_URL (and optional DATABASE_URL_UNPOOLED) in .env.local"
  );
  process.exit(0);
}

console.log("🔄 Running database migrations…");

const drizzleKit = join(process.cwd(), "node_modules/drizzle-kit/bin.cjs");
execFileSync(
  process.execPath,
  [drizzleKit, "migrate"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || url,
      DATABASE_URL: process.env.DATABASE_URL || url,
    },
  }
);
console.log("✅ Migrations applied");
