export const AI_SQL_LIMITS = {
  context: 60_000,
  error: 4000,
  imageBytes: 5 * 1024 * 1024,
  images: 4,
  prompt: 2000,
  sql: 30_000,
} as const
