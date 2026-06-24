import { db } from '@conar/db'
import { chats, chatsInsertSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from './events'

const schema = chatsInsertSchema.omit('userId', 'activeStreamId', 'title')

export const create = orpc
  .use(subscriptionMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const inserted = await db.insert(chats).values(input.map(item => ({
      ...item,
      userId: context.user.id,
      activeStreamId: null,
    }))).returning()

    for (const chat of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: chat,
      })
    }
  })
