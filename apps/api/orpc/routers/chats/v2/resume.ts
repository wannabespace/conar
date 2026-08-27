import { messagesFromRows } from '@tamery/ai/v2/message'
import { db } from '@tamery/db'
import { chats, chatsMessages, chatsMessagesParts } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, asc, eq } from 'drizzle-orm'

import { activeStreamFor } from '~/lib/chat-streams/registry'
import { beginStream } from '~/lib/chat-streams/stream'
import { authMiddleware, orpc } from '~/orpc'

export const resume = orpc
  .use(authMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    const rows = await db
      .select({
        messageId: chatsMessages.id,
        metadata: chatsMessages.metadata,
        order: chatsMessagesParts.order,
        part: chatsMessagesParts.part,
        role: chatsMessages.role,
      })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .innerJoin(
        chatsMessagesParts,
        eq(chatsMessagesParts.messageId, chatsMessages.id)
      )
      .where(
        and(
          eq(chatsMessages.chatId, input.chatId),
          eq(chats.userId, context.user.id)
        )
      )
      .orderBy(asc(chatsMessages.createdAt), asc(chatsMessagesParts.order))

    const messages = messagesFromRows(rows)

    const active = activeStreamFor({
      chatId: input.chatId,
      userId: context.user.id,
    })
    if (active) {
      return { streamId: active }
    }
    if (messages.at(-1)?.role !== 'user') {
      return { streamId: null }
    }

    return {
      streamId: beginStream({
        chatId: input.chatId,
        messages,
        userId: context.user.id,
      }),
    }
  })
