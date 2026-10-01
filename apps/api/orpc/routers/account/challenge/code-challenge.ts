import { RedisPublisher } from '@orpc/publisher/redis'

import { publisherRedis, publisherSubscriber, redis } from '~/lib/redis'

export const codeChallengePublisher = new RedisPublisher<
  Record<string, { ready: boolean }>
>(publisherRedis, {
  prefix: 'orpc:publisher:code-challenge:',
  subscriber: publisherSubscriber,
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
    await redis.setex(codeChallenge, 60 * 5, JSON.stringify(value))
  },
}
