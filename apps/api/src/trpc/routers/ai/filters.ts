import { google } from '@ai-sdk/google'
import { SQL_FILTERS_GROUPED, SQL_OPERATORS } from '@conar/shared/filters/sql'
import { generateObject } from 'ai'
import { type } from 'arktype'
import { consola } from 'consola'
import { z } from 'zod'
import { protectedProcedure } from '~/trpc'

export const filters = protectedProcedure
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .mutation(async ({ input, signal }) => {
    consola.info('sql filters input', input)

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      system: `
        You are a SQL filter generator that converts natural language queries into precise database filters.
        You should understand the sense of the prompt as much as possible, as users can ask with just a few words without any context.
        If you do not generate any filters, a user will not be able to filter the data.
        Each your filters response will replace the previous filters.

        Guidelines:
        - Return an empty array if the prompt is unclear or cannot be converted to filters
        - Create multiple filters when the query has multiple conditions
        - Use exact column names as provided in the context
        - Choose the most appropriate operator for each condition
        - Format values correctly based on column types (strings, numbers, dates, etc.)
        - For enum columns, ensure values match the available options
        - For exact days use >= and <= operators
        - If user asks 'empty' and the column is a string, use empty string as value
        - If context already contains a filter, you can use it as reference to generate a new filter

        Current time: ${new Date().toISOString()}
        Available operators: ${JSON.stringify(SQL_FILTERS_GROUPED, null, 2)}

        Table context:
        ${input.context}
      `,
      prompt: input.prompt,
      abortSignal: signal,
      schema: z.object({
        column: z.string(),
        operator: z.enum(SQL_OPERATORS),
        value: z.string(),
      }),
      schemaDescription: 'An array of objects with the following properties: column, operator, value where the operator is one of the SQL operators available',
      output: 'array',
    })

    consola.info('sql filters result object', object)

    return object
  })
