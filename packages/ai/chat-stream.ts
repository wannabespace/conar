import { convertToModelMessages, streamText, toUIMessageStream } from 'ai'
import { createResumableUIMessageStream } from 'ai-resumable-stream'
import { Redis } from 'ioredis'
import { createClient } from 'redis'
import { v7 } from 'uuid'

import { env } from './env'
import type { AppUIMessage } from './message'
import { chatModel } from './models'

const CHAT_INSTRUCTIONS = [
  'You are Tamery AI, an assistant built into the Tamery database client.',
  'Help the user with their databases: SQL, schema design, data questions, and anything else they ask.',
  'Be concise. Use fenced code blocks with a language tag for SQL and code.',
].join('\n')

const redis = new Redis(env.REDIS_URL)
const publisher = createClient({ url: env.REDIS_URL })
const subscriber = createClient({ url: env.REDIS_URL })

const STREAM_POINTER_TTL_SECONDS = 3600

const streamKey = (chatId: string) => `ai:chat-stream:${chatId}`

const releasePointer = async (key: string, streamId: string) => {
  if ((await redis.get(key)) === streamId) {
    await redis.del(key)
  }
}

interface ChatStreamInput {
  chatId: string
  messages: AppUIMessage[]
  onFinish: (message: AppUIMessage) => Promise<void>
}

const openChatStream = async (data: ChatStreamInput, streamId: string) => {
  const abortController = new AbortController()
  const context = await createResumableUIMessageStream({
    abortController,
    publisher,
    streamId,
    subscriber,
  })

  const result = streamText({
    abortSignal: abortController.signal,
    instructions: CHAT_INSTRUCTIONS,
    messages: await convertToModelMessages(data.messages),
    model: chatModel,
  })

  // oxlint-disable-next-line no-invalid-void-type
  const { promise, resolve } = Promise.withResolvers<void>()
  const uiStream = toUIMessageStream({
    generateMessageId: () => v7(),
    onEnd: async ({ responseMessage }) => {
      try {
        await data.onFinish(responseMessage)
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

  const key = streamKey(data.chatId)
  return context.startStream(uiStream, {
    keepAlive: promise,
    onFlush: () => releasePointer(key, streamId),
  })
}

export const claimChatStream = async (data: ChatStreamInput) => {
  const streamId = v7()
  const claimed = await redis.set(
    streamKey(data.chatId),
    streamId,
    'EX',
    STREAM_POINTER_TTL_SECONDS,
    'NX'
  )
  return claimed ? await openChatStream(data, streamId) : null
}

export const resumeChatStream = async (chatId: string) => {
  const key = streamKey(chatId)
  const streamId = await redis.get(key)
  if (!streamId) {
    return null
  }

  const context = await createResumableUIMessageStream({
    publisher,
    streamId,
    subscriber,
  })

  try {
    return await context.resumeStream()
  } catch {
    await releasePointer(key, streamId)
    return null
  }
}

export const stopChatStream = async (chatId: string) => {
  const streamId = await redis.get(streamKey(chatId))
  if (!streamId) {
    return
  }

  const context = await createResumableUIMessageStream({
    publisher,
    streamId,
    subscriber,
  })
  await context.stopStream()
}
