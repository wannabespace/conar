import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { z } from 'zod'
import { authMiddleware, orpc } from '~/orpc'

export const codeCompletion = orpc
  .use(authMiddleware)
  .input(z.object({
    context: z.string(),
    suffix: z.string().optional(),
    instruction: z.string().optional(),
    fileContent: z.string(),
    databaseType: z.enum(['postgres', 'mysql', 'clickhouse', 'mssql']),
    schemaContext: z.string().optional(),
  }))
  .output(z.object({
    completion: z.string(),
  }))
  .handler(async ({ input }) => {
    try {
      const databaseType = input.databaseType || 'postgres'
      const schemaContext = input.schemaContext || ''

      const enhancedPrompt = `You are an expert SQL code completion assistant.

Database Type: ${databaseType}

Database Schema:
${schemaContext}

Current Code BEFORE Cursor:
${input.context || ''}

Current Code AFTER Cursor:
${input.suffix || ''}

Full File Content:
${input.fileContent || ''}

Task: ${input.instruction || 'Complete the SQL query'}

General Safety Rules:
- Prioritize SELECT queries (read-only) when the intent is ambiguous.
- If the user explicitly starts writing a data modification query (INSERT, UPDATE, etc.), complete it validly.
- Do NOT generate destructive schema changes (DROP TABLE, TRUNCATE, ALTER) unless explicitly requested in a generic comment.

Specific Instructions:
- If the context is empty (start of file), return an empty string.
- For UUID/CUID: Use generation functions (e.g. gen_random_uuid()) instead of hardcoded strings if possible.
- For Foreign Keys: Do NOT plain guess IDs. Use subqueries (e.g. "(SELECT id FROM users ... LIMIT 1)") to make the query robust without needing external tools.
- Look at "Current Code AFTER Cursor". Do NOT generate code that is already present there (like closing parenthesis or semicolons). Make your completion join smoothly with the suffix.
- Intelligent Spacing: If the code before the cursor is a keyword or identifier (e.g., 'SELECT', 'FROM', 'tableName') and your completion starts with a keyword/identifier, ensure there is a space at the beginning of your completion.

Generate ONLY the completion text that should be inserted at the cursor position.
- Do NOT repeat the code that is already present before the cursor.
- Do NOT wrap in markdown code blocks.
- If no completion is needed, return an empty string.`

      const result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt: enhancedPrompt,
      })

      let cleanText = result.text.trim()
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\w*\s*/, '').replace(/\s*```$/, '')
      }

      return {
        completion: cleanText,
      }
    }
    catch (error) {
      console.error('Error in completion handler:', error instanceof Error ? error.message : 'Unknown error')
      return {
        completion: '',
      }
    }
  })
