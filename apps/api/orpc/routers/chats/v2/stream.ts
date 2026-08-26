import { ORPCError } from '@orpc/server'
import type { AppUIMessage } from '@tamery/ai/v2/message'
import type { ModelMessage } from '@tanstack/ai'
import { type } from 'arktype'

import { streamRecord } from '~/lib/chat-streams/registry'
import { joinStream, startStream } from '~/lib/chat-streams/stream'
import { authMiddleware, orpc } from '~/orpc'

// Offsets look like `memory:v1:<streamId>:<seq>`; the stream id is everything
// between the version and the sequence, and stream ids are uuids, so it never
// contains `:`.
const streamIdOf = (offset: string) => offset.split(':').at(-2) ?? ''

export const stream = orpc
  .use(authMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      connectionResourceId: 'string.uuid.v7',
      messages: 'object[]' as type.cast<(AppUIMessage | ModelMessage)[]>,
    })
  )
  .handler(async function* streamHandler({
    context,
    input,
    lastEventId,
    signal,
  }) {
    // `lastEventId` is an offset, and an offset names its stream: a reconnect
    // continues that answer instead of starting a second one.
    if (lastEventId) {
      const streamId = streamIdOf(lastEventId)
      const record = streamRecord(streamId)
      // No record means the retention window passed; the synced transcript
      // already carries the answer, so end cleanly.
      if (!record) {
        return
      }
      if (record.userId !== context.user.id) {
        throw new ORPCError('NOT_FOUND', { message: 'Stream not found' })
      }
      yield* joinStream({ offset: lastEventId, signal, streamId })
      return
    }

    yield* startStream({
      chatId: input.chatId,
      connectionResourceId: input.connectionResourceId,
      messages: input.messages,
      signal,
      userId: context.user.id,
    })
  })
