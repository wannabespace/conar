import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
import { type } from 'arktype'

import { sqlAdapter } from '~/lib/ai'
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
  .handler(({ input, signal }) =>
    chat({
      abortController: abortControllerFrom(signal),
      adapter: sqlAdapter,
      messages: [
        {
          content: [
            '=======SQL QUERY=======',
            input.sql,
            '=======END OF SQL QUERY=======',
            '=======ERROR=======',
            input.error,
            '=======END OF ERROR=======',
          ].join('\n'),
          role: 'user',
        },
      ],
      stream: false,
      systemPrompts: [
        [
          'You are an expert at fixing SQL queries based on the error message.',
          '- Fix the SQL query to be valid and correct.',
          `- The database type is "${input.type}".`,
          '- Preserve the same format and styling.',
          '- Return only the fixed SQL query, do not add any explanations, greetings, or extra text.',
          '- If the SQL query is already valid and correct, return it as is. Do not add any changes.',
        ].join('\n'),
      ],
    })
  )
