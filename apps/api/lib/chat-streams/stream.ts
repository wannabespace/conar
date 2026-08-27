import { withEventMeta } from '@orpc/server'
import { fastAdapter } from '@tamery/ai/adapters'
import { CHAT_SYSTEM_PROMPT } from '@tamery/ai/v2/prompt'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import {
  chat,
  EventType,
  memoryStream,
  normalizeToUIMessage,
} from '@tanstack/ai'
import { StreamProcessor } from '@tanstack/ai/client'
import { v7 as uuidv7 } from 'uuid'

import { ensureChat, persistMessage } from './persist'
import { finishStream, registerStream } from './registry'

// A join that lands before the stream's first chunk must WAIT, not give up: on
// timeout the adapter deletes the stream's log, and the producer then writes to
// a fresh one while the joined reader waits on the orphan forever.
const FIRST_CHUNK_DEADLINE_MS = 60_000

const streamLog = (streamId: string) =>
  memoryStream(
    { runId: streamId },
    { firstChunkDeadlineMs: FIRST_CHUNK_DEADLINE_MS }
  )

// Detached from the request on purpose: wiring a request signal in here turns a
// reload into a cancellation, which is what every built-in delivery sink does.
const driveStream = async (data: {
  chatId: string
  controller: AbortController
  messages: UIMessage[]
  streamId: string
  userId: string
}) => {
  const durability = streamLog(data.streamId)
  const processor = new StreamProcessor()

  try {
    const chunks = chat({
      abortController: data.controller,
      adapter: fastAdapter,
      messages: data.messages,
      runId: data.streamId,
      systemPrompts: [CHAT_SYSTEM_PROMPT],
      threadId: data.chatId,
    })

    for await (const chunk of chunks) {
      processor.processChunk(chunk)
      await durability.append([chunk])
    }
  } catch (error) {
    if (!data.controller.signal.aborted) {
      console.error(`chat stream ${data.streamId} failed`, error)
      await durability.append([
        {
          message: 'Something went wrong while generating the answer.',
          timestamp: Date.now(),
          type: EventType.RUN_ERROR,
        },
      ])
    }
  } finally {
    // Persist while the stream still reads as active, then close: a reload
    // landing mid-finish either joins the closing stream or finds the answer
    // already in the database — never neither.
    try {
      for (const message of processor.getMessages()) {
        if (message.role !== 'assistant') {
          continue
        }
        // oxlint-disable-next-line no-await-in-loop -- inserts must land in order; the UI sorts by createdAt
        await persistMessage({
          chatId: data.chatId,
          message,
          userId: data.userId,
        })
      }
    } finally {
      finishStream(data.streamId)
      await durability.close()
    }
  }
}

export const beginStream = (data: {
  chatId: string
  messages: UIMessage[]
  userId: string
}) => {
  const streamId = uuidv7()
  const controller = new AbortController()
  registerStream({
    chatId: data.chatId,
    controller,
    streamId,
    userId: data.userId,
  })

  void driveStream({
    chatId: data.chatId,
    controller,
    messages: data.messages,
    streamId,
    userId: data.userId,
  })

  return streamId
}

// Chunks come out tagged with their log offset so a reconnect's `lastEventId`
// names both the stream and the position to resume from.
export const joinStream = async function* joinStream(data: {
  offset: string | undefined
  signal: AbortSignal | undefined
  streamId: string
}) {
  try {
    for await (const entry of streamLog(data.streamId).read(
      data.offset ?? '-1',
      data.signal
    )) {
      yield withEventMeta(entry.chunk, { id: entry.offset })
    }
  } catch (error) {
    // An evicted or lost log means the answer already lives in the synced
    // transcript — end the stream cleanly instead of surfacing an error.
    if (
      error instanceof Error &&
      error.message.startsWith('Unknown or expired memory stream run')
    ) {
      return
    }
    throw error
  }
}

export const startStream = async function* startStream(data: {
  chatId: string
  connectionResourceId: string
  messages: (UIMessage | ModelMessage)[]
  signal: AbortSignal | undefined
  userId: string
}) {
  const messages = data.messages.map((message) =>
    normalizeToUIMessage(message, uuidv7)
  )
  const lastUserMessage = messages.findLast(
    (message) => message.role === 'user'
  )

  await ensureChat({
    chatId: data.chatId,
    connectionResourceId: data.connectionResourceId,
    userId: data.userId,
  })

  if (lastUserMessage) {
    await persistMessage({
      chatId: data.chatId,
      message: lastUserMessage,
      userId: data.userId,
    })
  }

  const streamId = beginStream({
    chatId: data.chatId,
    messages,
    userId: data.userId,
  })

  yield* joinStream({ offset: undefined, signal: data.signal, streamId })
}
