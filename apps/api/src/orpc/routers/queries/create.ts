import { type } from 'arktype'
import { db, queriesInsertSchema } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(type.or(
    queriesInsertSchema.omit('userId'),
    queriesInsertSchema.omit('userId').array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    await Promise.all(input.map(item => db
      .insert(queries)
      .values({
        ...item,
        userId: context.session.userId,
      })))
  })
