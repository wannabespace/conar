import { type } from 'arktype'

import { authMiddleware, orpc } from '~/orpc'

import { codeChallengePublisher, codeChallengeRedis } from '.'

export const publish = orpc
  .use(authMiddleware)
  .input(
    type({
      codeChallenge: 'string',
      'newUser?': 'boolean',
    })
  )
  .handler(async ({ input, context }) => {
    await codeChallengeRedis.set(input.codeChallenge, {
      newUser: input.newUser,
      userId: context.user.id,
    })
    codeChallengePublisher.publish(input.codeChallenge, { ready: true })
  })
