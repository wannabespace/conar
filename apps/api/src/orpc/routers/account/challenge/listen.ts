import { generateCodeChallenge } from '@conar/shared/utils/challenge'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { orpc } from '~/orpc'
import { codeChallengePublisher } from '.'

export const listen = orpc
  .input(type({
    codeChallenge: 'string',
    verifier: 'string',
  }))
  .handler(async function* ({ input, signal }) {
    for await (const payload of codeChallengePublisher.subscribe(input.codeChallenge, { signal })) {
      const generatedCodeChallenge = await generateCodeChallenge(input.verifier)

      if (generatedCodeChallenge !== input.codeChallenge) {
        throw new ORPCError('FORBIDDEN', { message: 'We couldn\'t authenticate you. Please try signing in again.' })
      }

      yield payload
    }
  })
