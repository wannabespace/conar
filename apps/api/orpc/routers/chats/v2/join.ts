import { ORPCError } from '@orpc/server'
import { type } from 'arktype'

import { streamRecord } from '~/lib/chat-streams/registry'
import { joinStream } from '~/lib/chat-streams/stream'
import { authMiddleware, orpc } from '~/orpc'

export const join = orpc
  .use(authMiddleware)
  // Not `string.uuid.v7`: a reload's resume pointer can hold a client-minted
  // run id from the pre-first-chunk window; the registry lookup below turns
  // any unknown id into a clean end instead of a validation error.
  .input(type({ streamId: 'string <= 128' }))
  .handler(async function* joinHandler({
    context,
    input,
    lastEventId,
    signal,
  }) {
    const record = streamRecord(input.streamId)
    // A missing record means the retention window passed; the synced
    // transcript has the answer, so end cleanly.
    if (!record) {
      return
    }
    if (record.userId !== context.user.id) {
      throw new ORPCError('NOT_FOUND', { message: 'Stream not found' })
    }

    yield* joinStream({
      offset: lastEventId,
      signal,
      streamId: input.streamId,
    })
  })
