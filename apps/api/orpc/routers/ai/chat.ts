import type { AppUIMessage } from '@conar/ai/tools/helpers'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { tools } from '@conar/ai/tools'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { streamToEventIterator } from '@orpc/server'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { createRetryable } from 'ai-retry'
import { type } from 'arktype'
import { v7 } from 'uuid'
import { withPosthog } from '~/lib/posthog'
import { orpc, subscriptionMiddleware } from '~/orpc'

const model = createRetryable({
  model: anthropic('claude-opus-4-6'),
  retries: [
    openai('gpt-5.3-codex'),
    google('gemini-pro-latest'),
  ],
})

function handleError(error: unknown) {
  if (typeof error === 'object' && (error as { type?: string }).type === 'overloaded_error') {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  if (typeof error === 'object' && (error as { message?: string }).message?.includes('prompt is too long')) {
    return 'Sorry, I was unable to generate a response. Currently I cannot handle larger chats like yours. Please create a new chat.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

export const chat = orpc
  .use(subscriptionMiddleware)
  .use(async ({ context, next }) => {
    context.setHeader('Transfer-Encoding', 'chunked')
    context.setHeader('Connection', 'keep-alive')

    return next()
  })
  .input(type({
    id: 'string.uuid.v7',
    type: type.valueOf(ConnectionType),
    context: 'string',
    createdAt: 'Date',
    updatedAt: 'Date',
    messages: 'object[]' as type.cast<AppUIMessage[]>,
  }))
  .handler(async ({ input, context, signal }) => {
    context.addLogData({
      chatId: input.id,
      connectionType: input.type,
      inputMessages: input.messages.map(message => ({
        id: message.id,
        role: message.role,
        partsCount: message.parts.length,
      })),
    })

    const result = streamText({
      messages: [
        {
          role: 'system',
          content: [
            '<role>',
            `You are Conar AI, an expert ${input.type} database assistant embedded in a production database editor. You help users write, understand, debug, and optimize SQL queries. You are concise, precise, and security-conscious.`,
            '</role>',
            '',
            '<rules>',
            'Response format:',
            '- Reply in the same language as the user\'s message.',
            '- Use markdown. Place each SQL query in its own ```sql code block.',
            '- Do not use headings (no # or ##). Keep answers flat and scannable.',
            '- When generating SQL, briefly explain what the query does and why you wrote it that way.',
            '- When a query involves joins, subqueries, CTEs, or window functions, explain the logic step by step.',
            '- If a query could be slow on large tables, proactively mention it and suggest alternatives (indexes, LIMIT, pagination).',
            '- If the user asks to modify specific lines in their current query, generate only the changed part — not the entire query.',
            '',
            'SQL generation:',
            `- Write valid, production-ready SQL for the ${input.type} dialect only.`,
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
            '- If a request seems destructive or risky, confirm the user\'s intent before providing the query.',
            '</rules>',
            '',
            '<tool_strategy>',
            'You have tools — use them proactively when they help produce a better answer:',
            '',
            Object.entries(tools).map(([name, { description }]) => `- ${name}: ${description}`).join('\n'),
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
            `Database dialect: ${input.type}`,
            `Current date and time: ${new Date().toISOString()}`,
            '',
            input.context,
            '</context>',
          ].join('\n'),
        },
        ...(await convertToModelMessages(input.messages)),
      ],
      stopWhen: stepCountIs(Number.POSITIVE_INFINITY),
      abortSignal: signal,
      model: withPosthog(model, {
        chatId: input.id,
        userId: context.user.id,
      }),
      experimental_transform: smoothStream(),
      tools,
    })

    const stream = result.toUIMessageStream({
      originalMessages: input.messages,
      generateMessageId: () => v7(),
      sendSources: true,
      onFinish: async (result) => {
        context.addLogData({
          response: {
            ...result.responseMessage,
            parts: result.responseMessage.parts.map(part => part.type),
          },
        })
      },
      onError: (error) => {
        context.addLogData({
          streamError: error,
        })

        return handleError(error)
      },
    })

    return streamToEventIterator(stream)
  })
