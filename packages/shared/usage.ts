export const FREE_LIMITS = {
  filters: { max: 50, period: 'month' },
  mcp: { max: 100, period: 'week' },
} as const satisfies Record<string, { max: number; period: 'month' | 'week' }>

export type MeteredFeature = keyof typeof FREE_LIMITS

export const usageResetsAt = (feature: MeteredFeature, now = new Date()) =>
  FREE_LIMITS[feature].period === 'month'
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    : Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - ((now.getUTCDay() + 6) % 7) + 7
      )
