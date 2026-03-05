import { type } from 'arktype'
import { getAnonymousUserIdFromToken, mergeAnonymousUserData } from '~/lib/auth'
import { authMiddleware, orpc } from '~/orpc'
import { codeChallengePublisher, codeChallengeRedis } from '.'

export const publish = orpc
  .use(authMiddleware)
  .input(type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
    'anonymousToken?': 'string',
  }))
  .handler(async ({ input, context }) => {
    if (input.anonymousToken) {
      const anonId = await getAnonymousUserIdFromToken(input.anonymousToken)
      if (anonId)
        await mergeAnonymousUserData(anonId, context.user.id)
    }

    await codeChallengeRedis.set(input.codeChallenge, {
      userId: context.user.id,
      newUser: input.newUser,
    })
    codeChallengePublisher.publish(input.codeChallenge, { ready: true })
  })
