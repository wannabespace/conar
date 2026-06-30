import { openai } from '@ai-sdk/openai'
import { db } from '@tamery/db'
import { chatsMessages } from '@tamery/db/schema'
import { generateText } from 'ai'
import { type } from 'arktype'
import { asc, eq } from 'drizzle-orm'
import { orpc, subscriptionMiddleware } from '~/orpc'

async function getMessages(chatId: string) {
  return db
    .select()
    .from(chatsMessages)
    .where(eq(chatsMessages.chatId, chatId))
    .orderBy(asc(chatsMessages.createdAt))
}

export const enhancePrompt = orpc
  .use(subscriptionMiddleware)
  .input(type({
    prompt: 'string',
    chatId: 'string.uuid.v7',
  }))
  .handler(async ({ input, signal }) => {
    const messages = await getMessages(input.chatId)

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: [
            'You are an expert at rewriting and clarifying user prompts. Your task is to rewrite the user\'s prompt to be as clear, specific, and unambiguous as possible.',
            '- Fix typos and grammar mistakes if needed.',
            '- If the prompt is already clear and specific, return it as is.',
            '- Do not add any explanations, greetings, or extra text, return only the improved prompt.',
            '- Make the prompt concise, actionable, and easy for an AI to generate the correct answer.',
            '- The prompt may be related to SQL.',
            '- Do not invent or assume any information that is not present in the original prompt or chat messages.',
            '- Do not add details, context, or requirements that are not explicitly stated by the user.',
            '- If the prompt is already clear and specific, make minimal changes',
            '- Maintain the user\'s original tone and intent',
            '',
            'Context from current chat conversation:',
            JSON.stringify(messages.map(m => ({
              role: m.role,
              parts: m.parts.filter(p => p.type === 'text'),
            })), null, 2),
            '',
            'Please rewrite the following user prompt to be more effective:',
          ].join('\n'),
        },
        {
          role: 'user',
          content: input.prompt,
        },
      ],
      abortSignal: signal,
    })

    return text
  })
