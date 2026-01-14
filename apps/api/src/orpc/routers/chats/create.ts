import { type } from 'arktype'
import { chats, chatsInsertSchema, db } from '~/drizzle'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const create = orpc
  .use(requireSubscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'activeStreamId', 'title'))
  .output(type({}))
  .handler(async ({ context, input }) => {
    await db.insert(chats).values({
      ...input,
      activeStreamId: null,
      userId: context.user.id,
    })

    return {}
  })
