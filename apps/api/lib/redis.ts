import type { MaybePromise } from '@tamery/shared/utils'
import { Redis } from 'ioredis'
import { createClient } from 'redis'

import { env } from '~/env'

export const redis = new Redis(env.REDIS_URL)
// node-redis crashes the process on an unhandled 'error' event; every client needs a listener.
export const publisherRedis = createClient({ url: env.REDIS_URL }).on(
  'error',
  console.error
)
export const publisherSubscriber: typeof publisherRedis = publisherRedis
  .duplicate()
  .on('error', console.error)

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
