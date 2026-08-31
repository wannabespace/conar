import type { MaybePromise } from '@tamery/shared/utils/helpers'
import { Redis } from 'ioredis'

import { env } from '~/env'

export const redis = new Redis(env.REDIS_URL)

export const redisMemoize = async <T>(
  fn: () => MaybePromise<T>,
  key: string,
  ttl: number = 60 * 60 * 24
) => {
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached) as T
  }

  const data = await fn()
  await redis.setex(key, ttl, JSON.stringify(data === undefined ? null : data))
  return data
}
