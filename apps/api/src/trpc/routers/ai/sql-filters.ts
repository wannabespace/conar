import { google } from '@ai-sdk/google'
import { SQL_OPERATORS_LIST } from '@conar/shared/utils/sql'
import { generateObject } from 'ai'
import { type } from 'arktype'
import { z } from 'zod'
import { protectedProcedure } from '~/trpc'

export const sqlFilters = protectedProcedure
  .input(type({
    prompt: 'string',
    context: 'string',
  }))
  .mutation(async ({ input, signal }) => {
    console.info('sql filters input', input)
    const { prompt, context } = input

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      system: `
        You are a SQL filter generator that converts natural language queries into precise database filters.
        Try to better understand the sense of the prompt because user can ask just in a few words without any context
        Your task is to analyze the user's prompt and create appropriate SQL filters based on the table structure.
        If you are not generate any filters, a user will not be able to filter the data.

        Guidelines:
        - Return an empty array if the prompt is unclear or cannot be converted to filters
        - Create multiple filters when the query has multiple conditions
        - Use exact column names as provided in the context
        - Choose the most appropriate operator for each condition
        - Format values correctly based on column types (strings, numbers, dates, etc.)
        - For enum columns, ensure values match the available options
        - For exact days use >= and <= operators
        - If user asks 'empty' and the column is a string, use empty string as value

        Current time: ${new Date().toISOString()}
        Available operators: ${JSON.stringify(SQL_OPERATORS_LIST, null, 2)}

        Table context:
        ${context}
      `,
      prompt,
      abortSignal: signal,
      schema: z.object({
        column: z.string(),
        operator: z.enum(SQL_OPERATORS_LIST.map(operator => operator.value) as [string, ...string[]]),
        value: z.string(),
      }),
      schemaDescription: 'An array of objects with the following properties: column, operator, value where the operator is one of the SQL operators available',
      output: 'array',
    })

    console.info('sql filters result object', object)

    return object
  })
