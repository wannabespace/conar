import { type } from 'arktype'

import { orpc } from '~/orpc'

import {
  codeChallengePublisher,
  codeChallengeRedis,
  codeChallengeSchema,
} from './code-challenge'

export const listen = orpc
  .input(
    type({
      codeChallenge: codeChallengeSchema,
    })
  )
  .handler(async function* listen({ input, signal }) {
    const events = codeChallengePublisher.subscribe(input.codeChallenge, {
      signal,
    })

    yield { ready: !!(await codeChallengeRedis.get(input.codeChallenge)) }
    yield* events
  })
