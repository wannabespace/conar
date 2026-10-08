export const FREE_WEEKLY_LIMITS = { filters: 20, mcp: 100 } as const

export type MeteredFeature = keyof typeof FREE_WEEKLY_LIMITS

export const usageResetsAt = (now = new Date()) =>
  Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - ((now.getUTCDay() + 6) % 7) + 7
  )
