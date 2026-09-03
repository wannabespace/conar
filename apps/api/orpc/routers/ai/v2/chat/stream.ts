import { ORPCError } from '@orpc/server'
import { claimChatStream } from '@tamery/ai/chat-stream'
import type { AppUIMessage } from '@tamery/ai/message'
import { validateUIMessages } from 'ai'
import { type } from 'arktype'

import {
  ensureChat,
  loadChatMessages,
  persistChatTitle,
  persistMessage,
} from '~/lib/chat-persist'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const stream = orpc
  .use(subscriptionMiddleware)
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

    const str = await claimChatStream({
      chatId: input.chatId,
      messages: history,
      onFinish: (message) =>
        persistMessage({
          chatId: input.chatId,
          message,
          userId: context.user.id,
        }),
    })

    if (!str) {
      throw new ORPCError('CONFLICT', {
        message: 'This chat is already generating an answer.',
      })
    }

    yield* str
  })
