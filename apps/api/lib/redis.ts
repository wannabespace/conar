import type { MaybePromise } from '@conar/shared/utils/helpers'
import { Redis } from 'ioredis'

import { env } from '~/env'

export const redis = new Redis(env.REDIS_URL)

export async function createRedisPubSub() {
  const redisSubscriber = redis.duplicate()
  const redisPublisher = redis.duplicate()

  return {
    subscriber: redisSubscriber,
    publisher: redisPublisher,
  }
}

export async function redisMemoize<T>(
  fn: () => MaybePromise<T>,
  key: string,
  ttl: number = 60 * 60 * 24,
) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const data = await fn()
  await redis.setex(key, ttl, JSON.stringify(data === undefined ? null : data))
  return data
}
