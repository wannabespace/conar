import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { chats, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      return
    }

    await db
      .delete(chats)
      .where(and(
        inArray(chats.id, input.map(item => item.id)),
        eq(chats.userId, context.user.id),
      ))
  })
