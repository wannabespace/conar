import { anthropic } from '@ai-sdk/anthropic'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { generateText } from 'ai'
import { type } from 'arktype'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

export const updateSQL = orpc
  .use(authMiddleware)
  .input(type({
    sql: 'string',
    prompt: 'string',
    type: type.valueOf(DatabaseType),
  }))
  .handler(async ({ input, signal, context }) => {
    const { text } = await generateText({
      model: withPosthog(anthropic('claude-haiku-4-5'), {
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
            'Always return a valid SQL query as output, without any explanations or markdown.',
            'This SQL will paste directly into a SQL editor.',
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
