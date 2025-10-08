import { google } from '@ai-sdk/google'
import { SQL_FILTERS_GROUPED, SQL_OPERATORS } from '@conar/shared/filters/sql'
import { generateObject } from 'ai'
import { type } from 'arktype'
import { z } from 'zod'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

export const filters = orpc
  .use(authMiddleware)
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .handler(async ({ input, signal, context }) => {
    console.info('sql filters input', input.prompt)

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
        // '',
        // ' Ordering:',
        // ' - If the user requests sorting or ordering (e.g., "sort by date descending", "order by name ascending"), generate an orderBy object.',
        // ' - Use the exact column names from the context for ordering.',
        // ' - The orderBy object should have the column name as the key and the direction as the value ("ASC" for ascending, "DESC" for descending).',
        // ' - If no ordering is specified in the prompt, you may omit the orderBy object.',
        '',
        `Current time: ${new Date().toISOString()}`,
        `Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}`,
        '',
        'Table context:',
        input.context,
      ].join('\n'),
      prompt: input.prompt,
      abortSignal: signal,
      schema: z.object({
        // orderBy: z
        //   .object({})
        //   .catchall(
        //     z.enum(['ASC', 'DESC']).describe('The direction to order by: ASC for ascending, DESC for descending'),
        //   )
        //   .optional()
        //   .describe('An optional object specifying the order of the results, where each key is a column name and the value is the order direction (ASC or DESC). The object can be empty.'),
        filters: z
          .object({
            column: z.string().describe('The column name to filter by'),
            operator: z
              .enum(SQL_OPERATORS)
              .describe('The operator to use for the filter, must be one of the available SQL operators'),
            values: z
              .array(z.string().describe('A value to filter by for the specified column and operator'))
              .describe('The values to filter by for the given column and operator'),
          })
          .array()
          .describe('An array of filter objects, each specifying a column, operator, and values to filter by'),
      }).describe('An object with a single property "filters" that is an array of filters'),
      schemaDescription: 'An array of objects with the following properties: column, operator, value where the operator is one of the SQL operators available',
      output: 'object',
    })

    console.info('sql filters result object', object)

    return object
  })
