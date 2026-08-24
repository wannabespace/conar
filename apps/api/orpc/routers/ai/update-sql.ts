import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { abortControllerFrom } from '@tamery/shared/utils/helpers'
import { chat } from '@tanstack/ai'
import { type } from 'arktype'

import { chatAdapter } from '~/lib/ai'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const updateSQL = orpc
  .use(subscriptionMiddleware)
  .input(
    type({
      context: 'string',
      prompt: 'string',
      sql: 'string',
      type: type.valueOf(ConnectionType),
    })
  )
  .handler(({ input, signal }) =>
    chat({
      abortController: abortControllerFrom(signal),
      adapter: chatAdapter,
      messages: [
        {
          content: [
            '=======SELECTED SQL QUERY=======',
            input.sql,
            '=======END OF SELECTED SQL QUERY=======',
          ].join('\n'),
          role: 'user',
        },
        {
          content: [
            '=======PROMPT=======',
            input.prompt,
            '=======END OF PROMPT=======',
          ].join('\n'),
          role: 'user',
        },
      ],
      stream: false,
      systemPrompts: [
        [
          'You are an assistant that helps update SQL queries.',
          `The database type is "${input.type}".`,
          'Given an input SQL query, generate an improved or updated version of the query as requested by the user.',
          'Output only the updated SQL query, and nothing else.',
          'If the input SQL is correct and only minor changes are needed (such as adding a WHERE clause, changing a column or value, etc.), update just that part.',
          "User's prompt can contain several SQL queries, you should update all of them.",
          'Always return a valid SQL query as output, without any explanations or markdown.',
          'This SQL will paste directly into a SQL editor.',
          'Do not include ```sql or ``` at the beginning and end of the query.',
          '',
          'Database context:',
          input.context,
        ].join('\n'),
      ],
    })
  )
