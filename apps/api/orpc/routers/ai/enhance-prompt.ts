import { openai } from '@ai-sdk/openai'
import { db } from '@tamery/db'
import { chatsMessages } from '@tamery/db/schema'
import { generateText } from 'ai'
import { type } from 'arktype'
import { asc, eq } from 'drizzle-orm'

import { orpc, subscriptionMiddleware } from '~/orpc'

const getMessages = (chatId: string) =>
  db
    .select()
    .from(chatsMessages)
    .where(eq(chatsMessages.chatId, chatId))
    .orderBy(asc(chatsMessages.createdAt))

export const enhancePrompt = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      chatId: 'string.uuid.v7',
      prompt: 'string',
    })
  )
  .handler(async ({ input, signal }) => {
    const messages = await getMessages(input.chatId)

    const { text } = await generateText({
      abortSignal: signal,
      messages: [
        {
          content: [
            "You are an expert at rewriting and clarifying user prompts. Your task is to rewrite the user's prompt to be as clear, specific, and unambiguous as possible.",
            '- Fix typos and grammar mistakes if needed.',
            '- If the prompt is already clear and specific, return it as is.',
            '- Do not add any explanations, greetings, or extra text, return only the improved prompt.',
            '- Make the prompt concise, actionable, and easy for an AI to generate the correct answer.',
            '- The prompt may be related to SQL.',
            '- Do not invent or assume any information that is not present in the original prompt or chat messages.',
            '- Do not add details, context, or requirements that are not explicitly stated by the user.',
            '- If the prompt is already clear and specific, make minimal changes',
            "- Maintain the user's original tone and intent",
            '',
            'Context from current chat conversation:',
            JSON.stringify(
              messages.map((m) => ({
                parts: m.parts.filter((p) => p.type === 'text'),
                role: m.role,
              })),
              null,
              2
            ),
            '',
            'Please rewrite the following user prompt to be more effective:',
          ].join('\n'),
          role: 'system',
        },
        {
          content: input.prompt,
          role: 'user',
        },
      ],
      model: openai('gpt-4o-mini'),
    })

    return text
  })
