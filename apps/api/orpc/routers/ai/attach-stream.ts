import { restartChatStream, resumeChatStream } from '@tamery/ai/chat-stream'
import { db } from '@tamery/db'
import { type } from 'arktype'

import { loadChatMessages, persistMessage } from '~/lib/chat-persist'
import { authMiddleware, orpc } from '~/orpc'

export const attachStream = orpc
  .use(authMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async function* attachStream({ context, input }) {
    const owned = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })

    if (!owned) {
      return
    }

    const active = await resumeChatStream(input.chatId)
    if (active) {
      yield* active
      return
    }

    const messages = await loadChatMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })
    if (messages.at(-1)?.role !== 'user') {
      return
    }

    const restarted = await restartChatStream({
      chatId: input.chatId,
      messages,
      onFinish: (message) =>
        persistMessage({
          chatId: input.chatId,
          message,
          userId: context.user.id,
        }),
    })
    if (restarted) {
      yield* restarted
      return
    }

    const racing = await resumeChatStream(input.chatId)
    if (racing) {
      yield* racing
    }
  })
