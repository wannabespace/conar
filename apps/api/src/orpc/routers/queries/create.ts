import { type } from 'arktype'
import { db } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(type({
    databaseId: 'string.uuid.v7',
    name: 'string',
    query: 'string',
  }))
  .handler(async ({ context, input }) => {
    const [query] = await db
      .insert(queries)
      .values({
        userId: context.session.userId,
        databaseId: input.databaseId,
        name: input.name,
        query: input.query,
      })
      .returning({
        id: queries.id,
      })

    return query
  })
