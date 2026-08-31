import { ORPCError } from '@orpc/server'
import { generateChatTitle } from '@tamery/ai/title'
import { db } from '@tamery/db'
import { chats } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { loadChatMessages } from '~/lib/chat-persist'
import { authMiddleware, orpc } from '~/orpc'

import { publisher } from '../chats/events'

// Legacy surface: shipped desktop builds call this from the old client's
// message action. The current client never does — titles generate server-side
// inside `ai.stream`.
export const generateTitle = orpc
  .use(authMiddleware)
  .input(type({ chatId: 'string.uuid.v7' }))
  .handler(async ({ input, signal, context }) => {
    const ownedChat = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })
    if (!ownedChat) {
      throw new ORPCError('NOT_FOUND', { message: 'Chat not found' })
    }

    const messages = await loadChatMessages({
      chatId: input.chatId,
      userId: context.user.id,
    })

    context.addLogData({
      chatId: input.chatId,
      messagesCount: messages.length,
    })

    const title = await generateChatTitle({ messages, signal })

    if (!title) {
      throw new ORPCError('BAD_GATEWAY', { message: 'Empty title generated' })
    }

    context.addLogData({
      chatId: input.chatId,
      generatedTitle: title,
    })

    const [chatRecord] = await db
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, input.chatId), eq(chats.userId, context.user.id)))
      .returning()

    if (!chatRecord) {
      throw new Error(`Chat not found after title update: ${input.chatId}`)
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: chatRecord,
    })

    return title
  })
