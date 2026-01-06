import { generateCodeChallenge } from '@conar/shared/utils/challenge'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { auth } from '~/lib/auth'
import { orpc } from '~/orpc'
import { codeChallengeRedis } from '.'

export const exchange = orpc
  .input(type({
    codeChallenge: 'string',
    verifier: 'string',
  }))
  .handler(async function ({ input }) {
    const generatedCodeChallenge = await generateCodeChallenge(input.verifier)

    if (generatedCodeChallenge !== input.codeChallenge) {
      throw new ORPCError('FORBIDDEN', { message: 'We couldn\'t authenticate you. Please try signing in again.' })
    }

    const data = await codeChallengeRedis.get(input.codeChallenge)

    if (!data) {
      throw new ORPCError('FORBIDDEN', { message: 'We couldn\'t authenticate you. Please try signing in again.' })
    }

    const { token } = await (await auth.$context).internalAdapter.createSession(data.userId)
    await codeChallengeRedis.delete(input.codeChallenge)
    return { token, newUser: data.newUser }
  })
