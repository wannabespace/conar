import { count as _count } from 'drizzle-orm'
import { db, users } from '~/drizzle'
import { publicProcedure } from '~/trpc'

export const count = publicProcedure
  .query(async () => {
    const [result] = await db.select({ count: _count() }).from(users)
    return result.count
  })
