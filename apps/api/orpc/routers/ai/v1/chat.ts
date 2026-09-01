import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { webSearch } from '@exalabs/ai-sdk'
import { streamToEventIterator } from '@orpc/server'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { queryDocs, resolveLibraryId } from '@upstash/context7-tools-ai-sdk'
import type { InferUITools, ToolSet, UIDataTypes, UIMessage } from 'ai'
import {
  toUIMessageStream,
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
} from 'ai'
import { createRetryableModel } from 'ai-retry/language-model'
import { type } from 'arktype'
import { v7 } from 'uuid'
import * as z from 'zod/mini'

import { env } from '~/env'
import { orpc, subscriptionMiddleware } from '~/orpc'

const model = createRetryableModel({
  model: anthropic('claude-opus-4-8'),
  retries: [openai('gpt-5.3-codex'), google('gemini-pro-latest')],
})

const tools: ToolSet = {
  columns: tool({
    description:
      'Use this tool if you need to get the list of columns in a table.',
    inputSchema: z.object({
      tableAndSchema: z.object({
        schemaName: z.string(),
        tableName: z.string(),
      }),
    }),
    outputSchema: z.array(
      z.object({
        default: z.union([z.string(), z.null()]),
        id: z.string(),
        isEditable: z.boolean(),
        isNullable: z.boolean(),
        table: z.string(),
        type: z.string(),
      })
    ),
  }),
  enums: tool({
    description:
      'Use this tool if you need to get the list of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        schema: z.string(),
        value: z.string(),
      })
    ),
  }),
  select: tool({
    description: [
      'Use this tool to select data from the database to improve your response.',
      'Do not abuse this tool, unless you are 100% sure that the data will help to answer the question.',
      'Do not select any sensitive data, like password, token, secret, card number, etc.',
      'Mask sensitive data with asterisks if need to select to answer the question.',
      'Do not use any tables and schemas that are not provided in the input.',
      'tableName and schemaName will be concatenated to "schemaName.tableName".',
      'For tableName use only table without schema prefix.',
    ].join('\n'),
    inputSchema: z.object({
      limit: z.number(),
      offset: z.number(),
      orderBy: z.union([
        z.record(z.string(), z.enum(['ASC', 'DESC'])),
        z.null(),
      ]),
      select: z.array(z.string()),
      tableAndSchema: z.object({
        schemaName: z.string(),
        tableName: z.string(),
      }),
      whereConcatOperator: z.enum(['AND', 'OR']),
      whereFilters: z.array(
        z.object({
          column: z.string(),
          operator: z.enum(
            SQL_FILTERS_LIST.map((filter) => filter.operator) as [
              string,
              ...string[],
            ]
          ),
          values: z.array(z.string()),
        })
      ),
    }),
    outputSchema: z.unknown(),
  }),
  ...(env.EXA_API_KEY && { webSearch: webSearch({ apiKey: env.EXA_API_KEY }) }),
  ...(env.CONTEXT7_API_KEY && {
    queryDocs: queryDocs({ apiKey: env.CONTEXT7_API_KEY }),
    resolveLibraryId: resolveLibraryId({ apiKey: env.CONTEXT7_API_KEY }),
  }),
}

type LegacyUIMessage = UIMessage<
  { createdAt?: Date; updatedAt?: Date },
  UIDataTypes,
  InferUITools<typeof tools>
>

const chatSystemPrompt = (data: { connectionType: string; context: string }) =>
  [
    '<role>',
    `You are Tamery AI, an expert ${data.connectionType} database assistant embedded in a production database editor. You help users write, understand, debug, and optimize SQL queries. You are concise, precise, and security-conscious.`,
    '</role>',
    '',
    '<rules>',
    'Response format:',
    "- Reply in the same language as the user's message.",
    '- Use markdown. Place each SQL query in its own ```sql code block.',
    '- Do not use headings (no # or ##). Keep answers flat and scannable.',
    '- When generating SQL, briefly explain what the query does and why you wrote it that way.',
    '- When a query involves joins, subqueries, CTEs, or window functions, explain the logic step by step.',
    '- If a query could be slow on large tables, proactively mention it and suggest alternatives (indexes, LIMIT, pagination).',
    '- If the user asks to modify specific lines in their current query, generate only the changed part — not the entire query.',
    '',
    'SQL generation:',
    `- Write valid, production-ready SQL for the ${data.connectionType} dialect only.`,
    '- Reference only schemas, tables, columns, and enums provided in the context below — never hallucinate names.',
    '- Always quote identifiers (table and column names) to prevent case-sensitivity errors.',
    '- Use 2-space indentation and consistent formatting.',
    '- Prefer explicit column lists over SELECT *.',
    '- Always include a LIMIT unless the user explicitly asks for all rows.',
    '',
    'Security:',
    '- The generated SQL will be executed directly against a live database. Treat every query as production.',
    '- Never generate DROP, TRUNCATE, or DELETE without a WHERE clause unless the user explicitly requests it, and add a warning.',
    '- When using the select tool or generating queries, never expose sensitive data (passwords, tokens, secrets, card numbers). Mask with asterisks if needed.',
    "- If a request seems destructive or risky, confirm the user's intent before providing the query.",
    '</rules>',
    '',
    '<tool_strategy>',
    'You have tools — use them proactively when they help produce a better answer:',
    '',
    Object.entries(tools)
      .map(([name, { description }]) => `- ${name}: ${description}`)
      .join('\n'),
    '',
    'Guidelines:',
    '- Use "columns" to discover column names and types before writing queries for tables not fully described in the context.',
    '- Use "enums" when the user references or filters by enum values you don\'t see in the context.',
    '- Use "select" to fetch sample data when it would help you give a more accurate answer (e.g., verifying data shapes, checking edge cases). Do not abuse it — only query when the data genuinely improves your response.',
    '- Use "webSearch" when the user asks about topics outside the database schema, provides URLs, or needs current information.',
    '- Use "resolveLibraryId" and "queryDocs" when the user asks about ORMs, libraries, or APIs related to their database work.',
    '</tool_strategy>',
    '',
    '<context>',
    `Database dialect: ${data.connectionType}`,
    `Current date and time: ${new Date().toISOString()}`,
    '',
    data.context,
    '</context>',
  ].join('\n')

const handleError = (error: unknown) => {
  if (
    typeof error === 'object' &&
    (error as { type?: string }).type === 'overloaded_error'
  ) {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  if (
    typeof error === 'object' &&
    (error as { message?: string }).message?.includes('prompt is too long')
  ) {
    return 'Sorry, I was unable to generate a response. Currently I cannot handle larger chats like yours. Please create a new chat.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

export const chat = orpc
  .use(subscriptionMiddleware)
  .use(({ context, next }) => {
    context.setHeader('Transfer-Encoding', 'chunked')
    context.setHeader('Connection', 'keep-alive')

    return next()
  })
  .input(
    type({
      context: 'string',
      createdAt: 'Date',
      id: 'string.uuid.v7',
      messages: 'object[]' as type.cast<LegacyUIMessage[]>,
      type: type.valueOf(ConnectionType),
      updatedAt: 'Date',
    })
  )
  .handler(async ({ input, context, signal }) => {
    context.addLogData({
      chatId: input.id,
      connectionType: input.type,
      inputMessages: input.messages.map((message) => ({
        id: message.id,
        partsCount: message.parts.length,
        role: message.role,
      })),
    })

    const result = streamText({
      abortSignal: signal,
      allowSystemInMessages: true,
      experimental_transform: smoothStream(),
      messages: [
        {
          content: chatSystemPrompt({
            connectionType: input.type,
            context: input.context,
          }),
          role: 'system',
        },
        ...(await convertToModelMessages(input.messages)),
      ],
      model,
      stopWhen: stepCountIs(Number.POSITIVE_INFINITY),
      tools,
    })

    const stream = toUIMessageStream({
      generateMessageId: () => v7(),
      onError: (error) => {
        context.addLogData({
          streamError: error,
        })

        return handleError(error)
      },
      onFinish: (finishResult) => {
        context.addLogData({
          response: {
            ...finishResult.responseMessage,
            parts: finishResult.responseMessage.parts.map((part) => part.type),
          },
        })
      },
      originalMessages: input.messages,
      sendSources: true,
      stream: result.stream,
    })

    return streamToEventIterator(stream)
  })
