import { chatStream, lastAnswer } from '@tamery/ai/features'
import { db } from '@tamery/db'
import { type } from 'arktype'

import { chatPersist } from '~/lib/chat-persist'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const abortStream = orpc
  .use(subscriptionMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    const owned = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })

    if (!owned) {
      return
    }

    await chatStream.stop(input.chatId)

    const messages = await chatPersist.loadMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })
    const lastMessage = messages.at(-1)
    if (lastMessage?.role === 'user') {
      await lastAnswer.mark(input.chatId, lastMessage.id)
    }
  })
