import { db } from '@tamery/db'
import { users } from '@tamery/db/schema'
import { eq } from 'drizzle-orm'

import { cacheMiddleware, orpc } from '~/orpc'

const PUBLIC_PRECISION = 1000

export const userCount = orpc
  .use(cacheMiddleware(60 * 60))
  .handler(async () => {
    const count = await db.$count(users, eq(users.isAnonymous, false))

    return Math.floor(count / PUBLIC_PRECISION) * PUBLIC_PRECISION
  })
