import type { LanguageModelV1 } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { tryCatch } from '@connnect/shared/utils/try-catch'
import { TRPCError } from '@trpc/server'
import { generateText } from 'ai'
import { z } from 'zod'
import { protectedProcedure } from '~/trpc'

const schema = z.object({
  prompt: z.string().min(1),
  type: z.nativeEnum(DatabaseType),
  existingQuery: z.string().optional(),
  context: z.object({
    columns: z.string(),
    tables: z.string(),
    enums: z.string(),
  }),
})

function generateSqlQuery({
  input,
  model,
  signal,
}: {
  input: z.infer<typeof schema>
  model: LanguageModelV1
  signal: AbortSignal
}) {
  return generateText({
    abortSignal: signal,
    model,
    prompt: `You are an expert SQL developer. Generate valid SQL code for ${input.type} database based on this request: "${input.prompt}"

---
Database Context:
Existing Query: ${input.existingQuery}
Tables: ${input.context.tables}
Columns: ${input.context.columns}
Enums: ${input.context.enums}
---

Your task is to generate a valid SQL query for ${input.type} database based on the user's request: "${input.prompt}"

Requirements:
1. Output ONLY the SQL code with no explanations, comments, or markdown formatting
2. Ensure the SQL is 100% valid and optimized for ${input.type} database
3. Use proper table and column names exactly as provided in the context
4. Use 2 spaces for indentation and consistent formatting
5. If there's an existing query in the context, use it as a reference to improve upon
6. Consider performance implications for complex queries
7. The SQL will be executed directly in a production database editor
8. Generate SQL query only for the provided tables, columns and enums

Remember: Return ONLY executable SQL code with no additional text.
`,
  })
}

export const generateSql = protectedProcedure
  .input(schema)
  .mutation(async ({ input, signal }) => {
    console.info('Generating SQL', input)

    const { data, error } = await tryCatch(() => generateSqlQuery({
      input,
      model: anthropic('claude-3-7-sonnet-20250219'),
      signal: signal ?? AbortSignal.timeout(30000),
    }))

    if (data) {
      console.info('Generated SQL', data.text)

      return {
        text: data.text,
        status: 'success' as const,
      }
    }

    console.error('Error generating SQL', { error })

    if (error instanceof Error) {
      const isOverloaded = error.message.includes('Overloaded')

      if (isOverloaded) {
        const fallbackResult = await tryCatch(() => generateSqlQuery({
          input,
          model: anthropic('claude-3-5-haiku-latest'),
          signal: signal ?? AbortSignal.timeout(10000),
        }))

        if (fallbackResult.data) {
          console.info('Generated SQL with fallback model', {
            sql: fallbackResult.data.text,
          })

          return {
            text: fallbackResult.data.text,
            status: 'overloaded' as const,
          }
        }
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Cannot generate SQL, please try again later',
    })
  })
