import type { MeteredFeature } from '@tamery/shared/usage'
import { FREE_WEEKLY_LIMITS, usageResetsAt } from '@tamery/shared/usage'

import { redis } from './redis'

const keyOf = (userId: string, feature: MeteredFeature, resetsAt: number) =>
  `usage:${userId}:${feature}:${resetsAt}`

export const getUsage = async (userId: string, feature: MeteredFeature) =>
  Number((await redis.get(keyOf(userId, feature, usageResetsAt()))) ?? 0)

export const recordUsage = async (userId: string, feature: MeteredFeature) => {
  const resetsAt = usageResetsAt()
  const key = keyOf(userId, feature, resetsAt)
  const [used] = await redis
    .multi()
    .incr(key)
    .expireAt(key, new Date(resetsAt))
    .exec()
  return Number(used)
}

export const quotaOf = (feature: MeteredFeature, used: number) => ({
  max: FREE_WEEKLY_LIMITS[feature],
  resetAt: new Date(usageResetsAt()),
  used,
})
