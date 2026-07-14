import { db } from '@conar/db'
import { chats } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => (Array.isArray(data) ? data : [data])))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No chats to remove' })
    }

    await db.delete(chats).where(
      and(
        inArray(
          chats.id,
          input.map(item => item.id),
        ),
        eq(chats.userId, context.user.id),
      ),
    )

    for (const item of input) {
      publisher.publish(context.user.id, {
        type: 'delete',
        key: item.id,
      })
    }
  })
