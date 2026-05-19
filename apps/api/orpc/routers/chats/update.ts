import { db } from '@conar/db'
import { chats, chatsUpdateSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm/sql'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from '../sync/chats'

export const update = orpc
  .use(subscriptionMiddleware)
  .input(type.and(
    chatsUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'userId', 'activeStreamId', 'connectionId'),
    chatsUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    const [chat] = await db.update(chats).set(changes).where(and(eq(chats.id, id), eq(chats.userId, context.user.id))).returning()

    publisher.publish('event', {
      type: 'update',
      value: chat!,
      clientId: context.clientId,
    })
  })
