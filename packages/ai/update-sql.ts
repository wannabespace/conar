import { generateText } from 'ai'

import { models } from './models'
import { section, sqlOutputRules } from './prompt'

const updateSqlInstructions = (data: {
  connectionType: string
  context: string
}) =>
  [
    'You are an assistant that updates SQL queries.',
    'Given the selected SQL and a request, return the updated query.',
    'When only a minor change is needed (a WHERE clause, a column, a value), change just that part.',
    'The selection can contain several queries; update all of them.',
    ...sqlOutputRules(data.connectionType),
    '',
    'Database context:',
    data.context,
  ].join('\n')

export const updateSql = async (data: {
  connectionType: string
  context: string
  prompt: string
  signal?: AbortSignal
  sql: string
}) => {
  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: updateSqlInstructions(data),
    model: models.sql,
    prompt: [
      section('SELECTED SQL QUERY', data.sql),
      section('PROMPT', data.prompt),
    ].join('\n'),
  })
  return text
}
