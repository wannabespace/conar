import { db } from '@tamery/db'
import { chats, chatsInsertSchema } from '@tamery/db/schema'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(subscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'activeStreamId', 'title'))
  .handler(async ({ context, input }) => {
    const [inserted] = await db
      .insert(chats)
      .values({
        ...input,
        activeStreamId: null,
        userId: context.user.id,
      })
      .onConflictDoUpdate({
        set: input,
        target: chats.id,
      })
      .returning()

    if (!inserted) {
      throw new Error('Failed to create chat')
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
