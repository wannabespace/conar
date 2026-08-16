import { db } from '@tamery/db'
import { queriesInsertSchema } from '@tamery/db/schema'
import { queries } from '@tamery/db/schema/queries'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(authMiddleware)
  .input(queriesInsertSchema.omit('userId'))
  .handler(async ({ context, input }) => {
    const [inserted] = await db
      .insert(queries)
      .values({
        ...input,
        userId: context.user.id,
      })
      .returning()

    if (!inserted) {
      throw new Error('Failed to create query')
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
