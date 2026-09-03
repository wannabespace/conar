import { stopChatStream } from '@tamery/ai/chat-stream'
import { db } from '@tamery/db'
import { type } from 'arktype'

import { orpc, subscriptionMiddleware } from '~/orpc'

export const abortStream = orpc
  .use(subscriptionMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    const owned = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })

    if (owned) {
      await stopChatStream(input.chatId)
    }
  })
