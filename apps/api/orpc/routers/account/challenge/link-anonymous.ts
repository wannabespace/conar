import { isAnonymousUser } from '@conar/shared/utils/auth'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { redis } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'

export const linkAnonymous = orpc
  .use(authMiddleware)
  .input(type({
    codeChallenge: 'string',
  }))
  .handler(async ({ input, context }) => {
    if (!isAnonymousUser(context.user)) {
      throw new ORPCError('FORBIDDEN', { message: 'Only anonymous users can link data.' })
    }

    await redis.setex(`merge:${input.codeChallenge}`, 60 * 5, context.user.id)
  })
