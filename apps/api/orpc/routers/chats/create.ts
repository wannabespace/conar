import { db } from '~/drizzle'
import { chats, chatsInsertSchema } from '~/drizzle/schema'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const create = orpc
  .use(subscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'activeStreamId', 'title'))
  .handler(async ({ context, input }) => {
    await db.insert(chats).values({
      ...input,
      activeStreamId: null,
      userId: context.user.id,
    })
  })
