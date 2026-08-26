import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { chats, chatsInsertSchema } from '@tamery/db/schema'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(subscriptionMiddleware)
  .input(chatsInsertSchema.omit('userId', 'title'))
  .handler(async ({ context, input }) => {
    const [inserted] = await db
      .insert(chats)
      .values({
        ...input,
        userId: context.user.id,
      })
      .onConflictDoNothing()
      .returning()

    if (!inserted) {
      const existing = input.id
        ? await db.query.chats.findFirst({
            columns: { id: true },
            where: { id: { eq: input.id }, userId: { eq: context.user.id } },
          })
        : undefined
      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Chat not found' })
      }
      return
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
