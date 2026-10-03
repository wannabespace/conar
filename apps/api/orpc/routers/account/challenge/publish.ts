import { type } from 'arktype'

import { authMiddleware, orpc } from '~/orpc'

import { codeChallengePublisher, codeChallengeRedis } from './code-challenge'

export const publish = orpc
  .use(authMiddleware)
  .input(
    type({
      codeChallenge: 'string',
      'newUser?': 'boolean',
    })
  )
  .errors({
    FORBIDDEN: { message: 'Sign in with an account to continue.' },
  })
  .handler(async ({ input, context, errors }) => {
    // exchange moves a guest's data into the published user, so that user must never be a guest.
    if (context.user.isAnonymous) {
      throw errors.FORBIDDEN()
    }

    await codeChallengeRedis.set(input.codeChallenge, {
      newUser: input.newUser,
      userId: context.user.id,
    })
    codeChallengePublisher.publish(input.codeChallenge, { ready: true })
  })
