import { EventPublisher } from '@orpc/server'
import { redis } from '~/lib/redis'
import { exchange } from './exchange'
import { listen } from './listen'
import { publish } from './publish'

export const codeChallengePublisher = new EventPublisher<Record<string, { ready: boolean }>>()

export const codeChallengeRedis = {
  get: async (codeChallenge: string) => {
    const value = await redis.get(codeChallenge)
    return value ? JSON.parse(value) as { userId: string, newUser?: boolean } : null
  },
  set: async (codeChallenge: string, value: { userId: string, newUser?: boolean }) => {
    await redis.setex(codeChallenge, 60 * 5, JSON.stringify(value))
  },
  delete: async (codeChallenge: string) => {
    await redis.del(codeChallenge)
  },
}

export const challenge = {
  listen,
  publish,
  exchange,
}
