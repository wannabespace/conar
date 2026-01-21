import { anthropic } from '@ai-sdk/anthropic'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { generateText } from 'ai'
import { type } from 'arktype'
import { withPosthog } from '~/lib/posthog'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const updateSQL = orpc
  .use(requireSubscriptionMiddleware)
  .input(type({
    sql: 'string',
    prompt: 'string',
    type: type.valueOf(ConnectionType),
    context: 'string',
  }))
  .handler(async ({ input, signal, context }) => {
    const { text } = await generateText({
      model: withPosthog(anthropic('claude-sonnet-4-5'), {
        userId: context.user.id,
      }),
      messages: [
        {
          role: 'system',
          content: [
            'You are an assistant that helps update SQL queries.',
            `The database type is "${input.type}".`,
            'Given an input SQL query, generate an improved or updated version of the query as requested by the user.',
            'Output only the updated SQL query, and nothing else.',
            'If the input SQL is correct and only minor changes are needed (such as adding a WHERE clause, changing a column or value, etc.), update just that part.',
            'User\'s prompt can contain several SQL queries, you should update all of them.',
            'Always return a valid SQL query as output, without any explanations or markdown.',
            'This SQL will paste directly into a SQL editor.',
            '',
            'Database context:',
            input.context,
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            '=======SELECTED SQL QUERY=======',
            input.sql,
            '=======END OF SELECTED SQL QUERY=======',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            '=======PROMPT=======',
            input.prompt,
            '=======END OF PROMPT=======',
          ].join('\n'),
        },
      ],
      abortSignal: signal,
    })

    return text
  })
