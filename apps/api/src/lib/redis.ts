import Redis from 'ioredis'
import RedisMock from 'ioredis-mock'
import { env } from '~/env'

export const redis: Redis = env.REDIS_URL
  ? new Redis(`${env.REDIS_URL}?family=0`)
  : new RedisMock()
