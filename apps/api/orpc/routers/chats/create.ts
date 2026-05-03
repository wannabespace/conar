import { db } from '@conar/db'
import { chats, chatsInsertSchema } from '@conar/db/schema'
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
