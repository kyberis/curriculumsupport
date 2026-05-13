import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. For local dev: docker compose up -d, then set DATABASE_URL in .env.local (see .env.example)."
  );
}

const client = postgres(url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
