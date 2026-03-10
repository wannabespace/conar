import { type } from 'arktype'
import { db } from '~/drizzle'
import { chats, chatsInsertSchema } from '~/drizzle/schema'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const create = orpc
  .use(requireSubscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'activeStreamId', 'title', 'connectionId')
    // TODO: remove it in the future versions, saving databaseId for backward compatibility
    .and(type({
      'connectionId?': 'string.uuid.v7',
      'databaseId?': 'string.uuid.v7',
    })))
  .handler(async ({ context, input: { connectionId, databaseId, ...input } }) => {
    await db.insert(chats).values({
      ...input,
      connectionId: (connectionId ?? databaseId)!,
      activeStreamId: null,
      userId: context.user.id,
    })
  })
