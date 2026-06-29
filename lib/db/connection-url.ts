function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Pooled Postgres URL for app runtime queries. */
export function getDatabaseUrl(): string {
  return firstNonEmpty(
    process.env.DATABASE_URL,
    process.env.STORAGE_POSTGRES_URL,
    process.env.STORAGE_DATABASE_URL,
    process.env.STORAGE_POSTGRES_PRISMA_URL
  );
}

/** Direct Postgres URL for migrations (no pooler). */
export function getDatabaseUrlUnpooled(): string {
  return firstNonEmpty(
    process.env.DATABASE_URL_UNPOOLED,
    process.env.STORAGE_POSTGRES_URL_NON_POOLING,
    process.env.STORAGE_DATABASE_URL_UNPOOLED,
    getDatabaseUrl()
  );
}
