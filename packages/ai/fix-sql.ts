import { generateText } from 'ai'

import { sqlModel } from './models'

const fixSqlSystemPrompt = (connectionType: string) =>
  [
    'You are an expert at fixing SQL queries based on the error message.',
    '- Fix the SQL query to be valid and correct.',
    `- The database type is "${connectionType}".`,
    '- Preserve the same format and styling.',
    '- Return only the fixed SQL query, do not add any explanations, greetings, or extra text.',
    '- If the SQL query is already valid and correct, return it as is. Do not add any changes.',
  ].join('\n')

const fixSqlPrompt = (data: { error: string; sql: string }) =>
  [
    '=======SQL QUERY=======',
    data.sql,
    '=======END OF SQL QUERY=======',
    '=======ERROR=======',
    data.error,
    '=======END OF ERROR=======',
  ].join('\n')

export const fixSql = async (data: {
  connectionType: string
  error: string
  signal?: AbortSignal
  sql: string
}) => {
  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: fixSqlSystemPrompt(data.connectionType),
    model: sqlModel,
    prompt: fixSqlPrompt(data),
  })
  return text
}
