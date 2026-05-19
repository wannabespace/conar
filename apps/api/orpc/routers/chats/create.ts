import { db } from '@conar/db'
import { chats, chatsInsertSchema } from '@conar/db/schema'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from '../sync/chats'

export const create = orpc
  .use(subscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'activeStreamId', 'title'))
  .handler(async ({ context, input }) => {
    const [chat] = await db.insert(chats).values({
      ...input,
      activeStreamId: null,
      userId: context.user.id,
    }).returning()

    publisher.publish('event', {
      type: 'insert',
      value: chat!,
      clientId: context.clientId,
    })
  })
