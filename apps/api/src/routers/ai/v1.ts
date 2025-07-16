import type { Message } from 'ai4'
import { anthropic as anthropic1 } from '@ai-sdk/anthropic1'
import { google as google1 } from '@ai-sdk/google1'
import { openai as openai1 } from '@ai-sdk/openai1'
import { xai as xai1 } from '@ai-sdk/xai1'
import { AiSqlChatModel } from '@conar/shared/enums/ai-chat-model'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { zValidator } from '@hono/zod-validator'
import { smoothStream as smoothStream4, streamText as streamText4 } from 'ai4'
import { Hono } from 'hono'
import * as z from 'zod'

export const ai = new Hono()

const input = z.object({
  type: z.enum(DatabaseType),
  messages: z.object({
    id: z.string().optional(),
    role: z.enum<Message['role'][]>(['user', 'assistant', 'system', 'data']),
    content: z.string(),
    experimental_attachments: z.object({
      name: z.string(),
      contentType: z.string(),
      url: z.string(),
    }).array().optional(),
  }).array(),
  context: z.any(),
  model: z.string().optional(),
  currentQuery: z.string().optional(),
})

const models = {
  'claude-3-7-sonnet': anthropic1('claude-3-7-sonnet-20250219'),
  'claude-4-opus': anthropic1('claude-4-opus-20250514'),
  'gpt-4o-mini': openai1('gpt-4o-mini'),
  'gemini-2.5-pro': google1('gemini-2.5-pro'),
  'grok-3': xai1('grok-3'),
}

const autoModel = models[AiSqlChatModel.Claude_3_7_Sonnet]

ai.post('/sql-chat', zValidator('json', input), async (c) => {
  const { type, messages, context, model, currentQuery = '' } = c.req.valid('json')

  console.info('messages', messages)

  const result = streamText4({
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
        - Answer in markdown and paste the SQL code in a code block
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
      ...messages,
    ],
    abortSignal: c.req.raw.signal,
    model: !model || model === 'auto' ? autoModel : models[model as keyof typeof models],
    experimental_transform: smoothStream4(),
    onFinish: (result) => {
      console.info('result', result)
    },
    onError: (error) => {
      console.error('error', error)
    },
  })

  return result.toDataStreamResponse({
    headers: {
      'Transfer-Encoding': 'chunked',
    },
  })
})
