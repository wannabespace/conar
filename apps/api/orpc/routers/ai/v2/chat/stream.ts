import { chatStream } from '@tamery/ai/chat-stream'
import type { AppUIMessage } from '@tamery/ai/message'
import { validateUIMessages } from 'ai'
import { type } from 'arktype'

import { chatPersist } from '~/lib/chat-persist'
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
  .errors({
    BAD_REQUEST: { message: 'Invalid messages' },
    CONFLICT: { message: 'This chat is already generating an answer.' },
  })
  .handler(async function* streamHandler({ context, errors, input }) {
    const messages = await validateUIMessages<AppUIMessage>({
      messages: input.messages,
    }).catch(() => {
      throw errors.BAD_REQUEST()
    })

    const { title } = await chatPersist.ensureChat({
      chatId: input.chatId,
      connectionResourceId: input.connectionResourceId,
      userId: context.user.id,
    })

    const lastUserMessage = messages.findLast(
      (message) => message.role === 'user'
    )
    if (lastUserMessage) {
      await chatPersist.persistMessage({
        chatId: input.chatId,
        message: lastUserMessage,
        userId: context.user.id,
      })
    }

    const history = await chatPersist.loadMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })

    const previousAnswer = history.at(-1)
    if (previousAnswer?.role === 'assistant') {
      await chatPersist.deleteMessage({
        chatId: input.chatId,
        messageId: previousAnswer.id,
        userId: context.user.id,
      })
      history.pop()
    }

    if (!title) {
      void chatPersist.persistTitle({
        chatId: input.chatId,
        messages: history,
        userId: context.user.id,
      })
    }

    const str = await chatStream.claim({
      chatId: input.chatId,
      messages: history,
      onFinish: (message) =>
        chatPersist.persistMessage({
          chatId: input.chatId,
          message,
          userId: context.user.id,
        }),
    })

    if (!str) {
      throw errors.CONFLICT()
    }

    yield* str
  })
