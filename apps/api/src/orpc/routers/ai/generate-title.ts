import type { AppUIMessage } from '@conar/shared/ai-tools'
import { openai } from '@ai-sdk/openai'
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
    const prompt = input.messages.map(message => message.parts
      .map(part => JSON.stringify(part, null, 2))
      .join('\n'),
    ).join('\n')

    const { text } = await generateText({
      model: withPosthog(openai('gpt-4o-mini'), {
        chatId: input.chatId,
        userId: context.user.id,
      }),
      system: [
        'You are a title generator that generates a title for a chat.',
        'The title should be in the same language as the user\'s message.',
        'Title should not be more than 30 characters.',
        'Title should be properly formatted, example: "Update Component in React".',
        'Each word should be capitalized.',
        'Do not use dots, commas, etc.',
        'Respond only with the title, nothing else.',
      ].join('\n'),
      prompt,
      abortSignal: signal,
    })

    console.info('generateTitle response', text)

    await db.update(chats).set({ title: text }).where(eq(chats.id, input.chatId))

    return text
  })
