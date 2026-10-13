import { db } from '@tamery/db'
import { sessions as sessionsTable } from '@tamery/db/schema'
import { and, desc, eq, gt } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

// better-auth's /list-sessions demands a session younger than freshAge, so a day-old sign-in lists nothing.
export const sessions = orpc.use(authMiddleware).handler(({ context }) =>
  db
    .select({
      current: eq(sessionsTable.id, context.session.id).mapWith(Boolean),
      id: sessionsTable.id,
      ipAddress: sessionsTable.ipAddress,
      userAgent: sessionsTable.userAgent,
    })
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.userId, context.user.id),
        gt(sessionsTable.expiresAt, new Date())
      )
    )
    .orderBy(desc(sessionsTable.createdAt))
)
