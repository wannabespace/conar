import { type } from 'arktype'
import { and, eq } from 'drizzle-orm/sql'
import { chats, chatsUpdateSchema, db } from '~/drizzle'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const update = orpc
  .use(subscriptionMiddleware)
  .input(type.and(
    chatsUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'userId', 'activeStreamId', 'connectionId'),
    chatsUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    await db.update(chats).set(changes).where(and(eq(chats.id, id), eq(chats.userId, context.user.id)))
  })
