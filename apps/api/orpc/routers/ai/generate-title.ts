import { ORPCError } from '@orpc/server'
import { fastAdapter } from '@tamery/ai/adapters'
import { TITLE_SYSTEM_PROMPT } from '@tamery/ai/prompts/title'
import { messageTextFromRows } from '@tamery/ai/v2/message'
import { db } from '@tamery/db'
import { chats } from '@tamery/db/schema'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from '../chats/events'

const getMessages = (chatId: string) =>
  db.query.chatsMessages.findMany({
    orderBy: { createdAt: 'asc' },
    where: { chatId },
    with: { parts: { orderBy: { order: 'asc' } } },
  })

export const generateTitle = orpc
  .use(authMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      'messages?': 'unknown',
    })
  )
  .handler(async ({ input, signal, context }) => {
    const ownedChat = await db.query.chats.findFirst({
      columns: { id: true },
      where: { id: { eq: input.chatId }, userId: { eq: context.user.id } },
    })
    if (!ownedChat) {
      throw new ORPCError('NOT_FOUND', { message: 'Chat not found' })
    }

    const messages = await getMessages(input.chatId)
    const prompt = messages
      .map((message) => messageTextFromRows(message.parts))
      .filter(Boolean)
      .join('\n')

    context.addLogData({
      chatId: input.chatId,
      prompt,
    })

    const text = await chat({
      abortController: abortControllerFrom(signal),
      adapter: fastAdapter,
      messages: [{ content: prompt, role: 'user' }],
      stream: false,
      systemPrompts: [TITLE_SYSTEM_PROMPT],
    })

    context.addLogData({
      chatId: input.chatId,
      generatedTitle: text,
    })

    const [chatRecord] = await db
      .update(chats)
      .set({ title: text })
      .where(and(eq(chats.id, input.chatId), eq(chats.userId, context.user.id)))
      .returning()

    if (!chatRecord) {
      throw new Error(`Chat not found after title update: ${input.chatId}`)
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: chatRecord,
    })

    return text
  })
