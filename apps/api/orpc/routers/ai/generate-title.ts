import { google } from '@ai-sdk/google'
import { db } from '@conar/db'
import { chats, chatsMessages } from '@conar/db/schema'
import { generateText } from 'ai'
import { type } from 'arktype'
import { asc, eq } from 'drizzle-orm'

import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

import { publisher } from '../chats/events'

async function getMessages(chatId: string) {
  return db
    .select()
    .from(chatsMessages)
    .where(eq(chatsMessages.chatId, chatId))
    .orderBy(asc(chatsMessages.createdAt))
}

export const generateTitle = orpc
  .use(authMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      messages: 'unknown?', // TODO: remove in future
    }),
  )
  .handler(async ({ input, signal, context }) => {
    const messages = await getMessages(input.chatId)
    const prompt = messages
      .map((message) =>
        message.parts
          .filter((part) => part.type === 'text')
          .map((part) => JSON.stringify(part, null, 2))
          .join('\n'),
      )
      .join('\n')

    context.addLogData({
      chatId: input.chatId,
      prompt,
    })

    const { text } = await generateText({
      model: withPosthog(google('gemini-flash-latest'), {
        chatId: input.chatId,
        userId: context.user.id,
      }),
      messages: [
        {
          role: 'system',
          content: [
            'You are a title generator that generates a title for a chat.',
            "The title should be in the same language as the user's message.",
            "Try to generate a title that is as close as possible to the user's message.",
            'Title should not be more than 30 characters.',
            'Title should be properly formatted, example: "Update component in React".',
            'Do not use dots, commas, etc.',
            'Generate only the text of the title, nothing else.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      abortSignal: signal,
    })

    context.addLogData({
      chatId: input.chatId,
      generatedTitle: text,
    })

    const [chat] = await db
      .update(chats)
      .set({ title: text })
      .where(eq(chats.id, input.chatId))
      .returning()

    publisher.publish(context.user.id, {
      type: 'update',
      value: chat!,
    })

    // TODO: remove in future, left for backward compatibility
    return text
  })
