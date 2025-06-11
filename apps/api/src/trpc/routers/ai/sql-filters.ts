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
        You are an expert SQL filter generator that converts natural language queries into precise database filters.
        Your primary goal is to accurately interpret user intent and generate appropriate SQL filters based on the table structure.
        Users may provide minimal context, so you must carefully analyze their intent from the prompt.

        Core Responsibilities:
        - Convert natural language queries into valid SQL filters
        - Handle both simple and complex filtering conditions
        - Ensure filters are compatible with the database schema
        - Return empty array if query intent is ambiguous

        Filter Generation Guidelines:
        - Use exact column names from the provided context
        - Format values according to column data types
        - Handle multiple conditions with appropriate operators
        - Validate enum values against available options
        - For date, use >= for start and <= for end date
        - For string 'empty' queries, use empty string value
        - Consider timezone implications for date/time filters

        Current Context:
        - Timestamp: ${new Date().toISOString()}
        - Available Operators: ${JSON.stringify(SQL_OPERATORS_LIST, null, 2)}

        Context:
        ================================
        ${context}
        ================================

        Remember: Your filters directly impact data visibility, so accuracy is crucial.
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
