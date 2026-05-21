import { db } from '@conar/db'
import { chats, chatsMessages } from '@conar/db/schema'
import { type } from 'arktype'
import { and, eq, inArray, or } from 'drizzle-orm'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from './events'

const input = type({
  id: 'string.uuid.v7',
  chatId: 'string.uuid.v7',
})

export const remove = orpc
  .use(subscriptionMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      return
    }

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

    for (const item of toRemove) {
      publisher.publish('event', {
        type: 'delete',
        key: item.id,
        clientId: context.clientId,
      })
    }
  })
