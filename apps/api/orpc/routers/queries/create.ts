import { db } from '@conar/db'
import { queriesInsertSchema } from '@conar/db/schema'
import { queries } from '@conar/db/schema/queries'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'

const schema = queriesInsertSchema
  .omit('userId', 'connectionId')
  // TODO: remove it in the future versions, saving databaseId for backward compatibility
  .and(type({
    'connectionId?': 'string.uuid.v7',
    'databaseId?': 'string.uuid.v7',
  }))

export const create = orpc
  .use(authMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    await db
      .insert(queries)
      .values(input.map(({ connectionId, databaseId, ...item }) => ({
        ...item,
        connectionId: (connectionId ?? databaseId)!,
        userId: context.session.userId,
      })))
  })
