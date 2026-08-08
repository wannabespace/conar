import { db } from '@tamery/db'
import { chats, chatsInsertSchema } from '@tamery/db/schema'
import { type } from 'arktype'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

const schema = chatsInsertSchema.omit('userId', 'activeStreamId', 'title')

export const create = orpc
  .use(subscriptionMiddleware)
  .input(type.or(schema, schema.array()).pipe(data => (Array.isArray(data) ? data : [data])))
  .handler(async ({ context, input }) => {
    const inserted = (
      await db.transaction(tx =>
        Promise.all(
          input.map(item =>
            tx
              .insert(chats)
              .values({
                ...item,
                userId: context.user.id,
                activeStreamId: null,
              })
              .onConflictDoUpdate({
                target: chats.id,
                set: item,
              })
              .returning(),
          ),
        ),
      )
    ).flat()

    for (const chat of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: chat,
      })
    }
  })
