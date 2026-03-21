import { type } from 'arktype'
import { mergeAnonymousUserData } from '~/lib/auth'
import { redis } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'
import { codeChallengePublisher, codeChallengeRedis } from '.'

export const publish = orpc
  .use(authMiddleware)
  .input(type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
  }))
  .handler(async ({ input, context }) => {
    const anonId = await redis.get(`merge:${input.codeChallenge}`)
    if (anonId) {
      await mergeAnonymousUserData(anonId, context.user.id)
      await redis.del(`merge:${input.codeChallenge}`)
    }

    await codeChallengeRedis.set(input.codeChallenge, {
      userId: context.user.id,
      newUser: input.newUser,
    })
    codeChallengePublisher.publish(input.codeChallenge, { ready: true })
  })
