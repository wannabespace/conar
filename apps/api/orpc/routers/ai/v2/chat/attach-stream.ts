import { chatStream, chatTurn } from '@tamery/ai/chat-stream'
import { db } from '@tamery/db'
import { type } from 'arktype'

import { chatPersist } from '~/lib/chat-persist'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const attachStream = orpc
  .use(subscriptionMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async function* attachStream({ context, input }) {
    const owned = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })

    if (!owned) {
      return
    }

    const active = await chatStream.resume(input.chatId)
    if (active) {
      yield* active
      return
    }

    const messages = await chatPersist.loadMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })
    const lastMessage = messages.at(-1)
    if (lastMessage?.role !== 'user') {
      return
    }

    if (await chatTurn.isSettled(input.chatId, lastMessage.id)) {
      return
    }

    const restarted = await chatStream.claim({
      chatId: input.chatId,
      messages,
      onFinish: (message) =>
        chatPersist.persistMessage({
          chatId: input.chatId,
          message,
          userId: context.user.id,
        }),
    })
    if (restarted) {
      yield* restarted
      return
    }

    const racing = await chatStream.resume(input.chatId)
    if (racing) {
      yield* racing
    }
  })
