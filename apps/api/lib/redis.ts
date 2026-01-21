import type { MaybePromise } from '@conar/shared/utils/helpers'
import Redis from 'ioredis'
import RedisMock from 'ioredis-mock'
import { env } from '~/env'

export function createRedisPubSub() {
  const redisSubscriber: Redis = env.REDIS_URL
    ? new Redis(`${env.REDIS_URL}?family=0`)
    : new RedisMock()

  const redisPublisher: Redis = env.REDIS_URL
    ? new Redis(`${env.REDIS_URL}?family=0`)
    : new RedisMock()

  return {
    subscriber: redisSubscriber,
    publisher: redisPublisher,
  }
}

export const redis: Redis = env.REDIS_URL
  ? new Redis(`${env.REDIS_URL}?family=0`)
  : new RedisMock()

export async function redisCache<T>(fn: () => MaybePromise<T>, key: string, ttl: number = 60 * 60 * 24) {
  const cached = await redis.get(key)
  if (cached)
    return JSON.parse(cached) as T

  const data = await fn()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
