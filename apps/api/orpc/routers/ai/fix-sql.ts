import { anthropic } from '@ai-sdk/anthropic'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { generateText } from 'ai'
import { type } from 'arktype'

import { orpc, subscriptionMiddleware } from '~/orpc'

export const fixSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      error: 'string',
      sql: 'string',
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(async ({ input, signal }) => {
    const { text } = await generateText({
      abortSignal: signal,
      messages: [
        {
          content: [
            'You are an expert at fixing SQL queries based on the error message.',
            '- Fix the SQL query to be valid and correct.',
            `- The database type is "${input.type}".`,
            '- Preserve the same format and styling.',
            '- Return only the fixed SQL query, do not add any explanations, greetings, or extra text.',
            '- If the SQL query is already valid and correct, return it as is. Do not add any changes.',
          ].join('\n'),
          role: 'system',
        },
        {
          content: [
            '=======SQL QUERY=======',
            input.sql,
            '=======END OF SQL QUERY=======',
          ].join('\n'),
          role: 'user',
        },
      ],
      model: anthropic('claude-sonnet-4-5'),
    })

    return text
  })
