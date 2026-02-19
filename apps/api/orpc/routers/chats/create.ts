import { type } from 'arktype'
import { chats, chatsInsertSchema, db } from '~/drizzle'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const create = orpc
  .use(subscriptionMiddleware)
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
