import { convertToModelMessages, streamText, toUIMessageStream } from 'ai'
import { createResumableUIMessageStream } from 'ai-resumable-stream'
import { createClient } from 'redis'
import { v7 } from 'uuid'

import { env } from './env'
import type { AppUIMessage } from './message'
import { models } from './models'

const CHAT_INSTRUCTIONS = [
  'You are Tamery AI, an assistant built into the Tamery database client.',
  'Help the user with their databases: SQL, schema design, data questions, and anything else they ask.',
  'Be concise. Use fenced code blocks with a language tag for SQL and code.',
].join('\n')

const redis = createClient({ url: env.REDIS_URL })
const subscriber = redis.duplicate()
await redis.connect()

const pointer = {
  claim: async (chatId: string, streamId: string) =>
    !!(await redis.set(pointer.key(chatId), streamId, { EX: 3600, NX: true })),
  get: (chatId: string) => redis.get(pointer.key(chatId)),
  key: (chatId: string) => `ai:chat-stream:${chatId}`,
  release: async (chatId: string, streamId: string) => {
    if ((await pointer.get(chatId)) === streamId) {
      await redis.del(pointer.key(chatId))
    }
  },
}

export const chatTurn = {
  isSettled: async (chatId: string, userMessageId: string) =>
    (await redis.get(chatTurn.key(chatId))) === userMessageId,
  key: (chatId: string) => `ai:chat-settled-turn:${chatId}`,
  settle: (chatId: string, userMessageId: string) =>
    redis.set(chatTurn.key(chatId), userMessageId, { EX: 60 * 60 * 24 * 7 }),
}

const resumable = (streamId: string, abortController?: AbortController) =>
  createResumableUIMessageStream({
    abortController,
    publisher: redis,
    streamId,
    subscriber,
  })

interface ChatStreamInput {
  chatId: string
  messages: AppUIMessage[]
  onFinish: (message: AppUIMessage) => Promise<void>
}

export const chatStream = {
  claim: async (data: ChatStreamInput) => {
    const streamId = v7()
    if (!(await pointer.claim(data.chatId, streamId))) {
      return null
    }

    try {
      const abortController = new AbortController()
      const context = await resumable(streamId, abortController)

      const result = streamText({
        abortSignal: abortController.signal,
        instructions: CHAT_INSTRUCTIONS,
        messages: await convertToModelMessages(data.messages),
        model: models.chat,
      })

      const answeredId = data.messages.findLast(
        (message) => message.role === 'user'
      )?.id
      // oxlint-disable-next-line no-invalid-void-type
      const { promise, resolve } = Promise.withResolvers<void>()
      const uiStream = toUIMessageStream({
        generateMessageId: () => v7(),
        onEnd: async ({ responseMessage }) => {
          try {
            await data.onFinish(responseMessage)
            if (answeredId) {
              await chatTurn.settle(data.chatId, answeredId)
            }
          } finally {
            resolve()
          }
        },
        onError: (error) => {
          console.error(`chat stream ${streamId} failed`, error)
          return 'Something went wrong while generating the answer.'
        },
        originalMessages: data.messages,
        stream: result.stream,
      })

      return await context.startStream(uiStream, {
        keepAlive: promise,
        onFlush: () => pointer.release(data.chatId, streamId),
      })
    } catch (error) {
      await pointer.release(data.chatId, streamId)
      throw error
    }
  },
  resume: async (chatId: string) => {
    const streamId = await pointer.get(chatId)
    if (!streamId) {
      return null
    }

    const context = await resumable(streamId)
    const active = await context.resumeStream().catch(() => null)
    if (!active) {
      await pointer.release(chatId, streamId)
    }
    return active
  },
  stop: async (chatId: string) => {
    const streamId = await pointer.get(chatId)
    if (streamId) {
      const context = await resumable(streamId)
      await context.stopStream()
    }
  },
}
