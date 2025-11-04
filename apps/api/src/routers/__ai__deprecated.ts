import type { LanguageModelV1, Message } from 'ai4'
import { anthropic, anthropic as anthropic1 } from '@ai-sdk/anthropic1'
import { google as google1 } from '@ai-sdk/google1'
import { openai as openai1 } from '@ai-sdk/openai1'
import { xai as xai1 } from '@ai-sdk/xai1'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { zValidator } from '@hono/zod-validator'
import { smoothStream, streamText } from 'ai4'
import { consola } from 'consola'
import { Hono } from 'hono'
import * as z from 'zod'

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
  // eslint-disable-next-line ts/no-explicit-any
  context: any
  messages: (Omit<Message, 'id'> & { id?: string })[]
  signal: AbortSignal
  currentQuery: string
}) {
  consola.info('messages', messages)

  return streamText({
    messages: [
      {
        role: 'system',
        content: [
          `You are an SQL tool that generates valid SQL code for ${type} database.`,
          '',
          'Requirements:',
          `- Ensure the SQL is 100% valid and optimized for ${type} database`,
          '- Use proper table and column names exactly as provided in the context',
          '- Use 2 spaces for indentation and consistent formatting',
          '- Consider performance implications for complex queries',
          '- The SQL code will be executed directly in a production database editor',
          '- Generate SQL query only for the provided schemas, tables, columns and enums',
          '- Answer in markdown and paste the SQL code in a code block',
          '- Answer in the same language as the user\'s message',
          '- Use quotes for table and column names to prevent SQL errors with case sensitivity',
          '',
          'Additional information:',
          `- Current date and time: ${new Date().toISOString()}`,
          '',
          'Current query in the SQL runner that user is writing:',
          `${currentQuery.trim() || 'Empty'}`,
          '',
          'Database Context:',
          `${JSON.stringify(context)}`,
          '----------------',
        ].join('\n'),
      },
      ...messages,
    ],
    abortSignal: signal,
    model,
    experimental_transform: smoothStream(),
    onFinish: (result) => {
      consola.info('result', result)
    },
    onError: (error) => {
      consola.error('error', error)
    },
  })
}

const models = {
  'claude-3-7-sonnet': anthropic1('claude-3-7-sonnet-20250219'),
  'claude-4-opus': anthropic1('claude-4-opus-20250514'),
  'gpt-4o-mini': openai1('gpt-4o-mini'),
  'gemini-2.5-pro': google1('gemini-2.5-pro'),
  'grok-3': xai1('grok-3'),
}

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
  model: z.enum(Object.keys(models) as [keyof typeof models, ...(keyof typeof models)[]]).or(z.literal('auto')).optional(),
  currentQuery: z.string().optional(),
})

const autoModel = models['claude-3-7-sonnet']

ai.post('/sql-chat', zValidator('json', input), async (c) => {
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

    return result.toDataStreamResponse({
      headers: {
        'Transfer-Encoding': 'chunked',
      },
    })
  }
  catch (error) {
    const isOverloaded = error instanceof Error && error.message.includes('Overloaded')

    if (isOverloaded) {
      consola.log('Request overloaded, trying to use fallback model')

      const result = generateStream({
        type,
        model: !model || model === 'auto' ? anthropic('claude-3-5-haiku-latest') : models[model],
        context,
        messages,
        currentQuery,
        signal: c.req.raw.signal,
      })

      return result.toDataStreamResponse({
        headers: {
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    throw error
  }
})
