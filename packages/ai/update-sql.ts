import { generateText } from 'ai'

import { chatModel } from './models'

const updateSqlSystemPrompt = (data: {
  connectionType: string
  context: string
}) =>
  [
    'You are an assistant that helps update SQL queries.',
    `The database type is "${data.connectionType}".`,
    'Given an input SQL query, generate an improved or updated version of the query as requested by the user.',
    'Output only the updated SQL query, and nothing else.',
    'If the input SQL is correct and only minor changes are needed (such as adding a WHERE clause, changing a column or value, etc.), update just that part.',
    "User's prompt can contain several SQL queries, you should update all of them.",
    'Always return a valid SQL query as output, without any explanations or markdown.',
    'This SQL will paste directly into a SQL editor.',
    'Do not include ```sql or ``` at the beginning and end of the query.',
    '',
    'Database context:',
    data.context,
  ].join('\n')

const updateSqlPrompt = (data: { prompt: string; sql: string }) =>
  [
    '=======SELECTED SQL QUERY=======',
    data.sql,
    '=======END OF SELECTED SQL QUERY=======',
    '=======PROMPT=======',
    data.prompt,
    '=======END OF PROMPT=======',
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
    instructions: updateSqlSystemPrompt(data),
    messages: [{ content: updateSqlPrompt(data), role: 'user' as const }],
    model: chatModel,
  })
  return text
}
