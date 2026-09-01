import { ORPCError } from '@orpc/server'
import { startChatStream } from '@tamery/ai/chat-stream'
import type { AppUIMessage } from '@tamery/ai/message'
import { validateUIMessages } from 'ai'
import { type } from 'arktype'

import {
  ensureChat,
  loadChatMessages,
  persistChatTitle,
  persistMessage,
} from '~/lib/chat-persist'
import { authMiddleware, orpc } from '~/orpc'

export const stream = orpc
  .use(authMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      connectionResourceId: 'string.uuid.v7',
      messages: 'object[]' as type.cast<AppUIMessage[]>,
    })
  )
  .handler(async function* streamHandler({ context, input }) {
    const messages = await validateUIMessages<AppUIMessage>({
      messages: input.messages,
    }).catch(() => {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid messages' })
    })

    const { title } = await ensureChat({
      chatId: input.chatId,
      connectionResourceId: input.connectionResourceId,
      userId: context.user.id,
    })

    const lastUserMessage = messages.findLast(
      (message) => message.role === 'user'
    )
    if (lastUserMessage) {
      await persistMessage({
        chatId: input.chatId,
        message: lastUserMessage,
        userId: context.user.id,
      })
    }

    // The stored transcript is the model context — the wire carries only the
    // new turn, and a re-sent id lands on the already-persisted row.
    const history = await loadChatMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })

    if (!title) {
      void persistChatTitle({
        chatId: input.chatId,
        messages: history,
        userId: context.user.id,
      })
    }

    yield* await startChatStream({
      chatId: input.chatId,
      messages: history,
      onFinish: (message) =>
        persistMessage({
          chatId: input.chatId,
          message,
          userId: context.user.id,
        }),
    })
  })
