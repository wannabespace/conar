import { type } from 'arktype'
import { db } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  'id?': 'string.uuid.v7',
  'databaseId': 'string.uuid.v7',
  'name': 'string',
  'query': 'string',
})

export const create = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    await db
      .insert(queries)
      .values(input.map(item => ({
        id: item.id,
        userId: context.session.userId,
        databaseId: item.databaseId,
        name: item.name,
        query: item.query,
      })))
  })
