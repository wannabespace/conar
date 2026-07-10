import { db } from '@conar/db'
import { queriesInsertSchema } from '@conar/db/schema'
import { queries } from '@conar/db/schema/queries'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'
import { publisher } from './events'

const schema = queriesInsertSchema.omit('userId')

export const create = orpc
  .use(authMiddleware)
  .input(type.or(schema, schema.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const inserted = await db
      .insert(queries)
      .values(input.map(item => ({
        ...item,
        userId: context.user.id,
      })))
      .returning()

    for (const query of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: query,
      })
    }
  })
