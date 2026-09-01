import { Chat } from '@ai-sdk/react'
import { eventIteratorToStream } from '@orpc/client'
import type { AppUIMessage } from '@tamery/ai/message'
import { memoize } from 'memoza'
import { v7 } from 'uuid'

import { orpc } from '~/lib/orpc'

export const getChatInstance = memoize(
  (data: { chatId: string; connectionResourceId: string }) =>
    new Chat<AppUIMessage>({
      id: data.chatId,
      generateId: v7,
      transport: {
        reconnectToStream: async ({ abortSignal }) => {
          const chunks = await orpc.ai.attachStream.call(
            { chatId: data.chatId },
            { signal: abortSignal }
          )
          const first = await chunks.next()
          if (first.done) {
            return null
          }
          return eventIteratorToStream(
            (async function* reconnectToStream() {
              yield first.value
              yield* chunks
            })()
          )
        },
        sendMessages: async ({ abortSignal, messages }) =>
          eventIteratorToStream(
            await orpc.ai.stream.call(
              {
                chatId: data.chatId,
                connectionResourceId: data.connectionResourceId,
                messages: messages.slice(-1),
              },
              { signal: abortSignal }
            )
          ),
      },
    }),
  {
    cacheKey: ({ chatId }) => chatId,
  }
)
