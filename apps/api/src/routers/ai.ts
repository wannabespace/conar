import type { databaseContextSchema } from '@connnect/shared/database'
import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { LanguageModelV1, Message } from 'ai'
import type { z } from 'zod'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { Hono } from 'hono'

export const ai = new Hono()

function generateStream({
  type,
  model,
  context,
  signal,
  messages,
}: {
  type: DatabaseType
  model: LanguageModelV1
  context: z.infer<typeof databaseContextSchema>
  messages: Message[]
  signal: AbortSignal
}) {
  console.info('messages', messages)

  return streamText({
    messages: [
      {
        role: 'system',
        content: `You are an SQL tool that generates valid SQL code for ${type} database.

        Requirements:
        1. Ensure the SQL is 100% valid and optimized for ${type} database
        2. Use proper table and column names exactly as provided in the context
        3. Use 2 spaces for indentation and consistent formatting
        4. Consider performance implications for complex queries
        5. The SQL code will be executed directly in a production database editor
        6. Generate SQL query only for the provided schemas, tables, columns and enums
        7. Answer in markdown and paste the SQL code in a code block.
        8. Say less, do not add useless information
        9. You can use SQL comments for additional information, examples:

        -- This is a comment
        SELECT * FROM users WHERE id = 1;

        ----------------
        Database Context:
        ${JSON.stringify(context)}
        ----------------
      `.trim(),
      },
      ...messages,
    ],
    abortSignal: signal,
    model,
    onFinish: (result) => {
      console.info('result', result)
    },
  })
}

ai.post('/sql-chat', async (c) => {
  const { type, messages, context } = await c.req.json()

  try {
    const result = generateStream({
      type,
      model: anthropic('claude-3-7-sonnet-20250219'),
      context,
      messages,
      signal: c.req.raw.signal,
    })

    return result.toDataStreamResponse()
  }
  catch (error) {
    const isOverloaded = error instanceof Error && error.message.includes('Overloaded')

    if (isOverloaded) {
      const result = generateStream({
        type,
        model: anthropic('claude-3-5-haiku-latest'),
        context,
        messages,
        signal: c.req.raw.signal,
      })

      return result.toDataStreamResponse()
    }

    throw error
  }
})
