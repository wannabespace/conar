import { type } from 'arktype'

import { accountMiddleware, orpc } from '~/orpc'

import {
  codeChallengePublisher,
  codeChallengeRedis,
  codeChallengeSchema,
} from './code-challenge'

export const publish = orpc
  .use(accountMiddleware)
  .input(
    type({
      codeChallenge: codeChallengeSchema,
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
