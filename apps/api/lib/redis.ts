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
