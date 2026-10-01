import type { MaybePromise } from '@tamery/shared/utils'
import { createClient } from 'redis'

import { env } from '~/env'

// node-redis crashes the process on an unhandled 'error' event; every client needs a listener.
export const redis = createClient({ url: env.REDIS_URL }).on(
  'error',
  console.error
)
export const redisSubscriber: typeof redis = redis
  .duplicate()
  .on('error', console.error)
await redis.connect()

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
  await redis.setEx(key, ttl, JSON.stringify(data === undefined ? null : data))
  return data
}
