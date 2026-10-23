import { RedisPublisher } from '@orpc/publisher/redis'

import { redis, redisSubscriber } from '~/lib/redis'

export const codeChallengePublisher = new RedisPublisher<
  Record<string, { ready: boolean }>
>(redis, {
  prefix: 'orpc:publisher:code-challenge:',
  subscriber: redisSubscriber,
})

const key = (codeChallenge: string) => `code-challenge:${codeChallenge}`

export const codeChallengeRedis = {
  delete: async (codeChallenge: string) => {
    await redis.del(key(codeChallenge))
  },
  get: async (codeChallenge: string) => {
    const value = await redis.get(key(codeChallenge))
    return value
      ? (JSON.parse(value) as { userId: string; newUser?: boolean })
      : null
  },
  set: async (
    codeChallenge: string,
    value: { userId: string; newUser?: boolean }
  ) => {
    await redis.setEx(key(codeChallenge), 60 * 5, JSON.stringify(value))
  },
}
