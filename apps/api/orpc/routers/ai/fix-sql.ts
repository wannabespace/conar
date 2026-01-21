import { anthropic } from '@ai-sdk/anthropic'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { generateText } from 'ai'
import { type } from 'arktype'
import { withPosthog } from '~/lib/posthog'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const fixSQL = orpc
  .use(requireSubscriptionMiddleware)
  .input(type({
    sql: 'string',
    error: 'string',
    type: type.valueOf(ConnectionType),
  }))
  .handler(async ({ input, signal, context }) => {
    const { text } = await generateText({
      model: withPosthog(anthropic('claude-sonnet-4-5'), {
        userId: context.user.id,
      }),
      abortSignal: signal,
      messages: [
        {
          role: 'system',
          content: [
            'You are an expert at fixing SQL queries based on the error message.',
            '- Fix the SQL query to be valid and correct.',
            `- The database type is "${input.type}".`,
            '- Preserve the same format and styling.',
            '- Return only the fixed SQL query, do not add any explanations, greetings, or extra text.',
            '- If the SQL query is already valid and correct, return it as is. Do not add any changes.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            '=======SQL QUERY=======',
            input.sql,
            '=======END OF SQL QUERY=======',
          ].join('\n'),
        },
      ],
    })

    return text
  })
