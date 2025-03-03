import { anthropic } from '@ai-sdk/anthropic'
import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { generateText } from 'ai'
import { z } from 'zod'
import { createLogger } from '~/lib/logger'
import { protectedProcedure } from '~/trpc'

const logger = createLogger('ai/generate-sql')

export const generateSql = protectedProcedure.input(z.object({
  prompt: z.string().min(1),
  type: z.nativeEnum(ConnectionType),
  context: z.string(),
})).mutation(async ({ input }) => {
  logger.info('Generating SQL', { prompt: input.prompt, type: input.type, context: input.context })
  const { text } = await generateText({
    model: anthropic('claude-3-7-sonnet-20250219'),
    prompt: `You are an expert SQL developer. Generate valid SQL code for ${input.type} database based on this request: "${input.prompt}"

Important instructions:
1. Respond ONLY with the SQL code, no explanations or markdown
2. Ensure the SQL is valid for ${input.type} database
3. Do not include any text before or after the SQL code
4. The SQL will be executed directly in a database editor
5. Use 2 spaces for indentation`,
  })
  logger.info('Generated SQL', { sql: text })

  return text
})
