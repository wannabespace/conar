import { messageText } from '@tamery/ai/v2/message'
import { db } from '@tamery/db'
import { chats, chatsMessages } from '@tamery/db/schema'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
import { type } from 'arktype'
import { asc, eq } from 'drizzle-orm'

import { fastAdapter } from '~/lib/ai'
import { authMiddleware, orpc } from '~/orpc'

import { publisher } from '../chats/events'

const getMessages = (chatId: string) =>
  db
    .select()
    .from(chatsMessages)
    .where(eq(chatsMessages.chatId, chatId))
    .orderBy(asc(chatsMessages.createdAt))

export const generateTitle = orpc
  .use(authMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      'messages?': 'unknown',
    })
  )
  .handler(async ({ input, signal, context }) => {
    const messages = await getMessages(input.chatId)
    const prompt = messages
      .map((message) => messageText(message))
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
      systemPrompts: [
        [
          'You are a title generator that generates a title for a chat.',
          "The title should be in the same language as the user's message.",
          "Try to generate a title that is as close as possible to the user's message.",
          'Title should not be more than 30 characters.',
          'Title should be properly formatted, example: "Update component in React".',
          'Do not use dots, commas, etc.',
          'Generate only the text of the title, nothing else.',
        ].join('\n'),
      ],
    })

    context.addLogData({
      chatId: input.chatId,
      generatedTitle: text,
    })

    const [chatRecord] = await db
      .update(chats)
      .set({ title: text })
      .where(eq(chats.id, input.chatId))
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
