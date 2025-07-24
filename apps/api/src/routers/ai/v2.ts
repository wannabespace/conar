import type { LanguageModel, UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { tools } from '@conar/shared/ai'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { zValidator } from '@hono/zod-validator'
import { convertToModelMessages, smoothStream, streamText } from 'ai'
import { Hono } from 'hono'
import * as z from 'zod'

export const ai = new Hono()

const input = z.object({
  type: z.enum(DatabaseType),
  context: z.any(),
  currentQuery: z.string().optional(),
  messages: z.object({
    role: z.enum<UIMessage['role'][]>(['user', 'assistant']),
    parts: z.array(z.any()),
  }).array(),
})

const mainModel = anthropic('claude-3-7-sonnet-20250219')
const fallbackModel = anthropic('claude-3-5-haiku-latest')

function generateStream({
  messages: uiMessages,
  type,
  context,
  currentQuery,
  model,
  signal,
}: {
  messages: z.infer<typeof input>['messages']
  type: z.infer<typeof input>['type']
  context: z.infer<typeof input>['context']
  currentQuery?: string
  model: LanguageModel
  signal: AbortSignal
}) {
  const messages = uiMessages.map(message => ({
    role: message.role,
    parts: message.parts as UIMessage['parts'],
  }))

  console.info('messages', JSON.stringify(messages, null, 2))

  const result = streamText({
    messages: [
      {
        role: 'system',
        content: `You are an SQL tool that generates valid SQL code for ${type} database.

        Requirements:
        - Ensure the SQL is 100% valid and optimized for ${type} database
        - Use proper table and column names exactly as provided in the context
        - Use 2 spaces for indentation and consistent formatting
        - Consider performance implications for complex queries
        - The SQL code will be executed directly in a production database editor
        - Generate SQL query only for the provided schemas, tables, columns and enums
        - Answer in markdown and paste the SQL code in a code block, do not use headings
        - Answer in the same language as the user's message
        - Use quotes for table and column names to prevent SQL errors with case sensitivity

        Additional information:
        - Current date and time: ${new Date().toISOString()}

        Current query in the SQL runner that user is writing:
        ${currentQuery || 'Empty'}

        Database Context:
        ${JSON.stringify(context)}
        ----------------
      `.trim(),
      },
      ...convertToModelMessages(messages),
    ],
    abortSignal: signal,
    model,
    experimental_transform: smoothStream(),
    tools,
  })

  return result.toUIMessageStreamResponse({
    onFinish: (result) => {
      console.info('result', result)
    },
    onError: (error) => {
      console.error('error', error)
      return error instanceof Error ? error.message : 'Unknown error'
    },
  })
}

ai.post('/sql-chat', zValidator('json', input), async (c) => {
  const { type, messages, context, currentQuery = '' } = c.req.valid('json')

  try {
    return generateStream({
      type,
      model: mainModel,
      context,
      messages,
      currentQuery,
      signal: c.req.raw.signal,
    })
  }
  catch (error) {
    const isOverloaded = error instanceof Error && error.message.includes('Overloaded')

    if (isOverloaded) {
      console.log('Request overloaded, trying to use fallback model')

      return generateStream({
        type,
        model: fallbackModel,
        context,
        messages,
        currentQuery,
        signal: c.req.raw.signal,
      })
    }

    throw error
  }
})
