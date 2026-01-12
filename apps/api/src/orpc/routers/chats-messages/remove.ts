import { type } from 'arktype'
import { and, eq, inArray, or } from 'drizzle-orm'
import { chats, chatsMessages, db } from '~/drizzle'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

const input = type({
  id: 'string.uuid.v7',
  chatId: 'string.uuid.v7',
})

export const remove = orpc
  .use(requireSubscriptionMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const toRemove = await db
      .select({ id: chatsMessages.id })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(and(
        eq(chats.userId, context.user.id),
        or(
          ...input.map(item => and(
            eq(chatsMessages.id, item.id),
            eq(chatsMessages.chatId, item.chatId),
          )),
        ),
      ))

    await db.delete(chatsMessages)
      .where(inArray(chatsMessages.id, toRemove.map(item => item.id)))
  })
