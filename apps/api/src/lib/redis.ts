import Redis from 'ioredis'
import { env } from '~/env'

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL)
  : {
      get: () => {
        console.warn('Redis is not configured, returning null')
        return Promise.resolve(null)
      },
      set: () => {
        console.warn('Redis is not configured, returning null')
        return Promise.resolve(null)
      },
    } as unknown as Redis
