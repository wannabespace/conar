import { openai } from '@ai-sdk/openai'
import { encode } from '@toon-format/toon'
import { generateText } from 'ai'
import { type } from 'arktype'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'
import { getMessages } from './ask'

export const enhancePrompt = orpc
  .use(authMiddleware)
  .input(type({
    prompt: 'string',
    chatId: 'string.uuid.v7',
  }))
  .handler(async ({ input, signal, context }) => {
    const messages = await getMessages(input.chatId)

    const { text } = await generateText({
      model: withPosthog(openai('gpt-4o-mini'), {
        chatId: input.chatId,
        prompt: input.prompt,
        userId: context.user.id,
      }),
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
            encode(messages),
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
