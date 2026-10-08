/** What the free plan gets of each metered feature; its `unlimited` permission (Pro) skips the count. */
export const FREE_LIMITS = {
  filters: { max: 50, period: 'month' },
  mcp: { max: 100, period: 'week' },
} as const satisfies Record<string, { max: number; period: 'month' | 'week' }>

export type MeteredFeature = keyof typeof FREE_LIMITS

/** When the current period ends, in UTC: an MCP device adopts the account's count only if both key the same period. */
export const usageResetsAt = (feature: MeteredFeature, now = new Date()) =>
  FREE_LIMITS[feature].period === 'month'
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    : Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - ((now.getUTCDay() + 6) % 7) + 7
      )
