import { db } from '@tamery/db'
import { sessions } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { auth } from '~/lib/auth'
import { authMiddleware, orpc } from '~/orpc'

export const revokeSession = orpc
  .use(authMiddleware)
  .input(type({ id: 'string' }))
  .handler(async ({ context, input }) => {
    const [session] = await db
      .select({ token: sessions.token })
      .from(sessions)
      .where(
        and(eq(sessions.id, input.id), eq(sessions.userId, context.user.id))
      )

    if (session) {
      const authContext = await auth.$context
      await authContext.internalAdapter.deleteSession(session.token)
    }
  })
