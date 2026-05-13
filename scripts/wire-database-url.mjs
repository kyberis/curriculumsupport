import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
let text = readFileSync(envPath, "utf8");

function quoted(key) {
  const m = new RegExp(`^${key}="([^"]*)"`, "m").exec(text);
  return m ? m[1] : null;
}

const pool = quoted("STORAGE_POSTGRES_URL");
const direct = quoted("STORAGE_POSTGRES_URL_NON_POOLING");
if (!pool || !direct) {
  console.error("Missing STORAGE_POSTGRES_URL or STORAGE_POSTGRES_URL_NON_POOLING");
  process.exit(1);
}

let textNew = text;
if (/^DATABASE_URL=""$/m.test(textNew)) {
  textNew = textNew.replace(/^DATABASE_URL=""$/m, `DATABASE_URL="${pool}"`);
} else {
  textNew = textNew.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${pool}"`);
}

if (/^DATABASE_URL_UNPOOLED=""$/m.test(textNew)) {
  textNew = textNew.replace(
    /^DATABASE_URL_UNPOOLED=""$/m,
    `DATABASE_URL_UNPOOLED="${direct}"`
  );
} else {
  textNew = textNew.replace(
    /^DATABASE_URL_UNPOOLED=.*$/m,
    `DATABASE_URL_UNPOOLED="${direct}"`
  );
}

textNew = textNew.replace(
  /^AUTH_URL=.*$/m,
  'AUTH_URL="http://localhost:3000"'
);

writeFileSync(envPath, textNew, "utf8");
console.log("Updated DATABASE_URL, DATABASE_URL_UNPOOLED, AUTH_URL in .env.local");
