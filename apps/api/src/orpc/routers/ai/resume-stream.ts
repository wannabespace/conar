import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { consola } from 'consola'
import { eq } from 'drizzle-orm'
import { createResumableStreamContext } from 'resumable-stream'
import { chats, db } from '~/drizzle'
import { createRedisPubSub } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'

const resumeStreamInputType = type({
  id: 'string.uuid.v7',
})

const { subscriber, publisher } = createRedisPubSub()

export const streamContext = createResumableStreamContext({
  waitUntil: null,
  subscriber,
  publisher,
})

export const resumeStream = orpc
  .use(authMiddleware)
  .input(resumeStreamInputType)
  .handler(async ({ input, context }) => {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, input.id))
      .limit(1)

    if (!chat) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat not found',
      })
    }

    if (chat.userId !== context.user.id) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Access denied',
      })
    }

    if (chat.activeStreamId == null) {
      return new Response(null, { status: 204 })
    }

    try {
      const stream = await streamContext.resumeExistingStream(chat.activeStreamId)

      if (!stream) {
        return new Response(null, { status: 204 })
      }

      return new Response(stream, { status: 200 })
    }
    catch (error) {
      consola.error('error resuming stream', error)

      await db.update(chats).set({ activeStreamId: null }).where(eq(chats.id, input.id))

      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to resume stream',
      })
    }
  })
