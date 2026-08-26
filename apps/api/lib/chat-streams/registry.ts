// Finished streams stay retained (inactive) for as long as `memoryStream` keeps
// their log (COMPLETED_LOG_TTL_MS), so a rejoin landing right after completion
// can still be ownership-checked instead of replaying unchecked or 404ing.
const RETAINED_STREAM_TTL_MS = 300_000

interface StreamRecord {
  active: boolean
  chatId: string
  controller: AbortController
  userId: string
}

const streams = new Map<string, StreamRecord>()

export const registerStream = (data: {
  chatId: string
  controller: AbortController
  streamId: string
  userId: string
}) => {
  streams.set(data.streamId, {
    active: true,
    chatId: data.chatId,
    controller: data.controller,
    userId: data.userId,
  })
}

export const finishStream = (streamId: string) => {
  const record = streams.get(streamId)
  if (!record) {
    return
  }
  record.active = false
  setTimeout(() => streams.delete(streamId), RETAINED_STREAM_TTL_MS)
}

export const activeStreamFor = (data: { chatId: string; userId: string }) => {
  for (const [streamId, stream] of streams) {
    if (
      stream.active &&
      stream.chatId === data.chatId &&
      stream.userId === data.userId
    ) {
      return streamId
    }
  }

  return null
}

export const abortStreamsFor = (data: { chatId: string; userId: string }) => {
  for (const stream of streams.values()) {
    if (
      stream.active &&
      stream.chatId === data.chatId &&
      stream.userId === data.userId
    ) {
      stream.controller.abort()
    }
  }
}

export const streamRecord = (streamId: string) => streams.get(streamId) ?? null
