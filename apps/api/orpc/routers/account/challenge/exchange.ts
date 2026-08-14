import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { sessions } from '@tamery/db/schema'
import { challenge } from '@tamery/shared/utils/challenge'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { auth } from '~/lib/auth'
import { orpc } from '~/orpc'

import { codeChallengeRedis } from '.'

export const exchange = orpc
  .input(
    type({
      codeChallenge: 'string',
      type: '"crypto" | "noble" = "crypto"',
      verifier: 'string',
    })
  )
  .handler(async ({ input, context: { headers } }) => {
    const generatedCodeChallenge = await challenge[input.type].generateCode(
      input.verifier
    )

    if (generatedCodeChallenge !== input.codeChallenge) {
      throw new ORPCError('NOT_ACCEPTABLE', {
        message: "We couldn't authenticate you. Please try signing in again.",
      })
    }

    const data = await codeChallengeRedis.get(input.codeChallenge)

    if (!data) {
      throw new ORPCError('FORBIDDEN', {
        message: "We couldn't authenticate you. Please try signing in again.",
      })
    }

    const context = await auth.$context
    const { token, id } = await context.internalAdapter.createSession(
      data.userId
    )
    await codeChallengeRedis.delete(input.codeChallenge)
    await db
      .update(sessions)
      .set({
        ipAddress: headers.get('X-Forwarded-For'),
        userAgent: headers.get('User-Agent'),
      })
      .where(eq(sessions.id, id))
    return { newUser: data.newUser, token }
  })
