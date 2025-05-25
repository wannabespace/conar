import type { LanguageModelV1, Message } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { databaseContextType } from '@connnect/shared/database'
import { AiSqlChatModel } from '@connnect/shared/enums/ai-chat-model'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { arktypeValidator } from '@hono/arktype-validator'
import { smoothStream, streamText } from 'ai'
import { type } from 'arktype'
import { Hono } from 'hono'

export const ai = new Hono()

function generateStream({
  type,
  model,
  context,
  signal,
  messages,
  currentQuery,
}: {
  type: DatabaseType
  model: LanguageModelV1
  context: typeof databaseContextType.infer
  messages: (Omit<Message, 'id'> & { id?: string })[]
  signal: AbortSignal
  currentQuery: string
}) {
  console.info('messages', messages)

  return streamText({
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
        - Answer in markdown and paste the SQL code in a code block.
        - Do not add useless information
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
      ...messages,
    ],
    experimental_transform: smoothStream(),
    abortSignal: signal,
    model,
    onFinish: (result) => {
      console.info('result', result)
    },
  })
}

const input = type({
  'type': type.valueOf(DatabaseType),
  'messages': type({
    'id?': 'string',
    'role': 'string' as type.cast<Message['role']>,
    'content': 'string',
    'experimental_attachments?': type({
      name: 'string',
      contentType: 'string',
      url: 'string',
    }).array(),
  }).array(),
  'context': databaseContextType,
  'model?': type.valueOf(AiSqlChatModel).or(type.enumerated('auto')),
  'currentQuery?': 'string',
})

const models: Record<AiSqlChatModel, LanguageModelV1> = {
  [AiSqlChatModel.Claude_3_7_Sonnet]: anthropic('claude-3-7-sonnet-20250219'),
  [AiSqlChatModel.Claude_4_Opus]: anthropic('claude-4-opus-20250514'),
  [AiSqlChatModel.GPT_4o_Mini]: openai('gpt-4o-mini'),
  [AiSqlChatModel.Gemini_2_5_Pro]: google('gemini-2.5-pro-exp-03-25'),
  [AiSqlChatModel.Grok_3]: xai('grok-3-latest'),
}

const autoModel = models[AiSqlChatModel.Claude_3_7_Sonnet]

ai.post('/sql-chat', arktypeValidator('json', input), async (c) => {
  const { type, messages, context, model, currentQuery = '' } = c.req.valid('json')

  try {
    const result = generateStream({
      type,
      model: !model || model === 'auto' ? autoModel : models[model],
      context,
      messages,
      currentQuery,
      signal: c.req.raw.signal,
    })

    return result.toDataStreamResponse()
  }
  catch (error) {
    const isOverloaded = error instanceof Error && error.message.includes('Overloaded')

    if (isOverloaded) {
      console.log('Request overloaded, trying to use fallback model')

      const result = generateStream({
        type,
        model: !model || model === 'auto' ? anthropic('claude-3-5-haiku-latest') : models[model],
        context,
        messages,
        currentQuery,
        signal: c.req.raw.signal,
      })

      return result.toDataStreamResponse()
    }

    console.log('Unhandled error in /sql-chat route:', error)

    throw error
  }
})
