import type { MeteredFeature } from '@tamery/shared/usage'
import { FREE_LIMITS, usageResetsAt } from '@tamery/shared/usage'

import { redis } from './redis'

const keyOf = (userId: string, feature: MeteredFeature, resetsAt: number) =>
  `usage:${userId}:${feature}:${resetsAt}`

export const getUsage = async (userId: string, feature: MeteredFeature) =>
  Number((await redis.get(keyOf(userId, feature, usageResetsAt(feature)))) ?? 0)

export const recordUsage = async (userId: string, feature: MeteredFeature) => {
  const resetsAt = usageResetsAt(feature)
  const key = keyOf(userId, feature, resetsAt)
  const used = await redis.incr(key)
  await redis.expire(key, Math.ceil((resetsAt - Date.now()) / 1000))
  return used
}

export const quotaOf = (feature: MeteredFeature, used: number) => ({
  max: FREE_LIMITS[feature].max,
  resetAt: new Date(usageResetsAt(feature)),
  used,
})
