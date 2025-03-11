import { anthropic } from '@ai-sdk/anthropic'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { tryCatch } from '@connnect/shared/utils/try-catch'
import { TRPCError } from '@trpc/server'
import { APICallError, generateText } from 'ai'
import { z } from 'zod'
import { createLogger } from '~/lib/logger'
import { protectedProcedure } from '~/trpc'

const logger = createLogger('ai/generate-sql')

const schema = z.object({
  prompt: z.string().min(1),
  type: z.nativeEnum(DatabaseType),
  context: z.string(),
})

function generateSqlQuery({
  input,
  model,
  signal,
}: {
  input: z.infer<typeof schema>
  model: Parameters<typeof anthropic>[0]
  signal: AbortSignal
}) {
  return generateText({
    abortSignal: signal,
    model: anthropic(model),
    prompt: `You are an expert SQL developer. Generate valid SQL code for ${input.type} database based on this request: "${input.prompt}"

---
User provides the context:
${input.context}
---

Important instructions:
1. Respond ONLY with the SQL code, no explanations or markdown
2. Ensure the SQL is valid for ${input.type} database
3. Do not include any text before or after the SQL code
4. The SQL will be executed directly in a database editor
5. Use 2 spaces for indentation
6. If in the context there is an query, use it as a reference to generate a new query
`,
  })
}

export const generateSql = protectedProcedure
  .input(schema)
  .mutation(async ({ input, signal }) => {
    logger.info('Generating SQL', {
      prompt: input.prompt,
      type: input.type,
      context: input.context,
    })

    const { data, error } = await tryCatch(() => generateSqlQuery({
      input,
      model: 'claude-3-7-sonnet-20250219',
      signal: signal ?? AbortSignal.timeout(30000),
    }))

    if (data) {
      logger.info('Generated SQL', data.text)

      return {
        text: data.text,
        status: 'success' as const,
      }
    }

    logger.error('Error generating SQL', { error })

    if (APICallError.isInstance(error)) {
      const isOverloaded = error.responseBody
        && JSON.parse(error.responseBody).detail === 'Overloaded'

      if (isOverloaded) {
        const fallbackResult = await tryCatch(() => generateSqlQuery({
          input,
          model: 'claude-3-5-sonnet-latest',
          signal: signal ?? AbortSignal.timeout(10000),
        }))

        if (fallbackResult.data) {
          logger.info('Generated SQL with fallback model', {
            sql: fallbackResult.data.text,
          })

          return {
            text: fallbackResult.data.text,
            status: 'overloaded' as const,
          }
        }

        logger.error('Error generating SQL with fallback model', {
          error: fallbackResult.error,
        })
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Cannot generate SQL, please try again later',
    })
  })
