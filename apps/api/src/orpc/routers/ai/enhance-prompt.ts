import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'
import { getMessages } from './ask'

export const enhancePrompt = orpc
  .use(authMiddleware)
  .input(type({
    prompt: 'string',
    chatId: 'string.uuid.v7',
  }))
  .handler(async ({ input, signal }) => {
    const messages = await getMessages(input.chatId)

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'system',
          content: `
            You are an expert at rewriting and clarifying user prompts. Your task is to rewrite the user's prompt to be as clear, specific, and unambiguous as possible.
            - Fix typos and grammar mistakes if needed.
            - If the prompt is already clear and specific, return it as is.
            - Do not add any explanations, greetings, or extra text, return only the improved prompt.
            - Make the prompt concise, actionable, and easy for an AI to generate the correct answer.
            - The prompt may be related to SQL.
            - Do not invent or assume any information that is not present in the original prompt or chat messages.
            - Do not add details, context, or requirements that are not explicitly stated by the user.

            Current messages in the chat:
            ${JSON.stringify(messages)}
          `,
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
