import { google } from '@ai-sdk/google'
import { SQL_FILTERS_GROUPED, SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { generateObject } from 'ai'
import { type } from 'arktype'
import { consola } from 'consola'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

const sqlFilterOperators = SQL_FILTERS_LIST.map(filter => `'${filter.operator}'`).join(' | ') as `'${typeof SQL_FILTERS_LIST[number]['operator']}'`

const filtersSchema = type({
  'filters': type({
    column: 'string',
    operator: sqlFilterOperators,
    values: 'string[]',
  }).array(),
  'orderBy?': { '[string]': `'ASC' | 'DESC'` },
})

export const filters = orpc
  .use(authMiddleware)
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .handler(async ({ input, signal, context }) => {
    consola.info('[SQL FILTERS] input', input.prompt)

    const { object } = await generateObject({
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
        'Ordering:',
        '- If the user requests sorting or ordering (e.g., "sort by date descending", "order by name ascending"), generate an orderBy object.',
        '- Use the exact column names from the context for ordering.',
        '- The orderBy object should have the column name as the key and the direction as the value ("ASC" for ascending, "DESC" for descending).',
        '- If no ordering is specified in the prompt, you may omit the orderBy object.',
        '',
        `Current time: ${new Date().toISOString()}`,
        `Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}`,
        '',
        'Table context:',
        input.context,
      ].join('\n'),
      prompt: input.prompt,
      abortSignal: signal,
      schema: filtersSchema,
      schemaDescription: 'An object with filters (array of filter objects with column, operator, values) and optional orderBy (object with column names as keys and "ASC" or "DESC" as values)',
      output: 'object',
    })

    consola.info('[SQL FILTERS] response', JSON.stringify(object, null, 2))

    return object
  })
