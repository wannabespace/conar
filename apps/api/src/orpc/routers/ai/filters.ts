import { google } from '@ai-sdk/google'
import { SQL_FILTERS_GROUPED, SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { generateText, Output } from 'ai'
import { type } from 'arktype'
import { consola } from 'consola'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

export const filters = orpc
  .use(authMiddleware)
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .handler(async ({ input, signal, context }) => {
    consola.info('[SQL FILTERS] input', input.prompt)

    const { output: result } = await generateText({
      model: withPosthog(google('gemini-2.0-flash'), {
        prompt: input.prompt,
        context: input.context,
        userId: context.user.id,
      }),
      system: [
        'You are a filters and ordering generator that converts natural language queries into database filters and ordering instructions.',
        'You should understand the sense of the prompt as much as possible.',
        'Each of your filters or ordering responses will replace the previous ones.',
        '',
        'Guidelines:',
        '- Create multiple filters when the query has multiple conditions',
        '- Use exact column names as provided in the context',
        '- Choose the most appropriate operator for each condition',
        '- Format values correctly based on column types (strings, numbers, dates, etc.)',
        '- For enum columns, ensure values match the available options',
        '- For exact days use >= and <= operators',
        '- If user asks \'empty\' and the column is a string, use empty string as item in values array',
        '- If context already contains a filter, you can use it as reference to generate a new filter',
        '- User can paste only the value, you should try to understand to which column the value belongs',
        '- Try to generate at least one filter unless the prompt is completely unclear',
        '',
        // 'Ordering:',
        // '- If the user requests sorting or ordering (e.g., "sort by date descending", "order by name ascending"), generate an orderBy object.',
        // '- Use the exact column names from the context for ordering.',
        // '- The orderBy object should have the column name as the key and the direction as the value ("ASC" for ascending, "DESC" for descending).',
        // '- If no ordering is specified in the prompt, you may omit the orderBy object.',
        // '',
        `Current time: ${new Date().toISOString()}`,
        `Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}`,
        '',
        'Table context:',
        input.context,
      ].join('\n'),
      prompt: input.prompt,
      abortSignal: signal,
      output: Output.object({
        schema: type({
          filters: type({
            column: 'string',
            operator: type.enumerated(...SQL_FILTERS_LIST.map(filter => filter.operator)),
            values: 'string[]',
          }).array(),
          // 'orderBy?': type({ '[string]': `'ASC' | 'DESC'` }),
        }).describe('An object with filters array and optional orderBy object; each filter has column, operator, and values; orderBy maps column names to sort direction.'),
        description: 'An array of objects with the following properties: column, operator, values where the operator is one of the SQL operators available',
      }),
    })

    consola.info('[SQL FILTERS] response', JSON.stringify(result, null, 2))

    return result
  })
