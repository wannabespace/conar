import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { chats, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const remove = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
  }))
  .handler(async ({ context, input }) => {
    await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, context.user.id)))
  })
