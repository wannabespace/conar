import type { AppUIMessage } from '~/ai/tools/helpers'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { chats, db } from '~/drizzle'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

export const generateTitle = orpc
  .use(authMiddleware)
  .input(type({
    chatId: 'string.uuid.v7',
    messages: 'Array' as type.cast<AppUIMessage[]>,
  }))
  .handler(async ({ input, signal, context }) => {
    const prompt = input.messages.map(message => message.parts.filter(part => part.type === 'text')
      .map(part => JSON.stringify(part, null, 2))
      .join('\n'),
    ).join('\n')

    context.addLogData({
      chatId: input.chatId,
      prompt,
    })

    const { text } = await generateText({
      model: withPosthog(google('gemini-2.5-flash'), {
        chatId: input.chatId,
        userId: context.user.id,
      }),
      messages: [
        {
          role: 'system',
          content: [
            'You are a title generator that generates a title for a chat.',
            'The title should be in the same language as the user\'s message.',
            'Try to generate a title that is as close as possible to the user\'s message.',
            'Title should not be more than 30 characters.',
            'Title should be properly formatted, example: "Update Component in React".',
            'Each word should be capitalized.',
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

    await db.update(chats).set({ title: text }).where(eq(chats.id, input.chatId))

    return text
  })
