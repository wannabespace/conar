import type { AppUIMessage } from '@conar/shared/ai'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { chats, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const generateTitle = orpc
  .use(authMiddleware)
  .input(type({
    chatId: 'string.uuid.v7',
    messages: 'Array' as type.cast<AppUIMessage[]>,
  }))
  .handler(async ({ input, signal }) => {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `
        You are a title generator that generates a title for a chat.
        The title should be in the same language as the user's message.
        Title should be a single sentence between 2 and 10 words.
        Title should be properly formatted, example: "Update component in React".
        Do not use dots, commas, etc.

        Here are the messages in the chat:
        ${input.messages.map(message => `${message.role}: ${message.parts.map(part => part.type === 'text' ? part.text : '').filter(Boolean).join('\n')}`).join('\n\n')}
      `,
      abortSignal: signal,
    })

    await db.update(chats).set({ title: text }).where(eq(chats.id, input.chatId))

    return text
  })
