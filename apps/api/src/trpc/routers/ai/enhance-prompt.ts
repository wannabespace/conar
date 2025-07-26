import type { UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { type } from 'arktype'
import { protectedProcedure } from '~/trpc'

export const enhancePrompt = protectedProcedure
  .input(type({
    prompt: 'string >= 10',
    messages: 'object[]' as type.cast<UIMessage[]>,
  }))
  .mutation(async ({ input, signal }) => {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: `
        You are an expert at rewriting and clarifying user prompts. Your task is to rewrite the user's prompt to be as clear, specific, and unambiguous as possible.
        - Fix typos and grammar mistakes if needed.
        - If the prompt is already clear and specific, return it as is.
        - Do not add any explanations, greetings, or extra text, return only the improved prompt.
        - Make the prompt concise, actionable, and easy for an AI to generate the correct answer.
        - The prompt may be related to SQL.
        - Do not invent or assume any information that is not present in the original prompt or chat messages.
        - Do not add details, context, or requirements that are not explicitly stated by the user.

        Current messages in the chat:
        ${JSON.stringify(input.messages)}
      `,
      prompt: input.prompt,
      abortSignal: signal,
    })

    return text
  })
