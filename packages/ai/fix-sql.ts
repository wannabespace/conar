import { generateText } from 'ai'

import { sqlModel } from './models'
import { section, sqlOutputRules } from './prompt'

const fixSqlInstructions = (connectionType: string) =>
  [
    'You are an expert at fixing SQL queries based on an error message.',
    'Fix the query so it is valid and correct, preserving its format and styling.',
    'If the query is already valid and correct, return it unchanged.',
    ...sqlOutputRules(connectionType),
  ].join('\n')

export const fixSql = async (data: {
  connectionType: string
  error: string
  signal?: AbortSignal
  sql: string
}) => {
  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: fixSqlInstructions(data.connectionType),
    model: sqlModel,
    prompt: [section('SQL QUERY', data.sql), section('ERROR', data.error)].join(
      '\n'
    ),
  })
  return text
}
