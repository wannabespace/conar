import { RedisPublisher } from '@orpc/publisher/redis'

import { redis, redisSubscriber } from '~/lib/redis'

export const codeChallengePublisher = new RedisPublisher<
  Record<string, { ready: boolean }>
>(redis, {
  prefix: 'orpc:publisher:code-challenge:',
  subscriber: redisSubscriber,
})

export const codeChallengeRedis = {
  delete: async (codeChallenge: string) => {
    await redis.del(codeChallenge)
  },
  get: async (codeChallenge: string) => {
    const value = await redis.get(codeChallenge)
    return value
      ? (JSON.parse(value) as { userId: string; newUser?: boolean })
      : null
  },
  set: async (
    codeChallenge: string,
    value: { userId: string; newUser?: boolean }
  ) => {
    await redis.setEx(codeChallenge, 60 * 5, JSON.stringify(value))
  },
}
